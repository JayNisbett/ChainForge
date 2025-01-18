import { useCallback } from "react";
import useStore from "../store/store";
import { addNode } from "../utils/app";

export const useMenuActions = () => {
  const addNodeToStore = useStore((state) => state.addNode);

  const addDynamicPromptNode = useCallback((promptData: any) => {
    addNode("dynamicPromptNode", "dynamicprompt", {
      _id: promptData._id,
      title: promptData.title || "Dynamic Prompt",
      categoryRef: promptData.categoryRef,
      fields: promptData.fields.map((field: any) => ({
        ...field,
        value: field.defaultValue || field.value || "",
      })),
      outputFormat: promptData.outputFormat,
      displayButton: promptData.displayButton,
      stream: promptData.stream,
    });
  }, []);

  const organizePromptsByCategory = useCallback(
    (prompts: any[], categories: { key: number; categoryName: string }[]) => {
      const categoryMap = new Map();

      categories.forEach((category) => {
        categoryMap.set(category.key, {
          ...category,
          prompts: [],
        });
      });

      prompts.forEach((prompt) => {
        const category = categoryMap.get(prompt.categoryRef);
        if (category) {
          category.prompts.push(prompt);
        }
      });

      return Array.from(categoryMap.values());
    },
    [],
  );

  return {
    addDynamicPromptNode,
    organizePromptsByCategory,
  };
};
