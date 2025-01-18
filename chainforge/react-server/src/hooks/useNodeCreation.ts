import { useCallback } from "react";
import { useStore } from "../store/store";
import { Dict } from "../backend/typing";
import { getViewportCenter, createNode } from "../utils/app";
import { ReactFlowInstance } from "reactflow";
import { v4 as uuid } from "uuid";

interface GroupNodeData {
  name: string;
  description?: string;
  groupId?: string;
  referencedFlowId?: string;
  nodes: Array<{ id: string; type: string; name?: string }>;
  connections?: Array<{
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
  isCollapsed?: boolean;
}

export const useNodeCreation = (rfInstance: ReactFlowInstance | null) => {
  const { addNode: addNodeToStore, projects, tasks } = useStore();

  const addNode = (
    id: string,
    type?: string,
    data?: Dict,
    offsetX?: number,
    offsetY?: number,
  ) => {
    const { x, y } = getViewportCenter();
    addNodeToStore({
      id: `${id}-` + Date.now(),
      type: type ?? id,
      data: data ?? {},
      position: {
        x: x - 200 + (offsetX || 0),
        y: y - 100 + (offsetY || 0),
      },
    });
  };

  const createNodeAtCenter = useCallback(
    (id: string, type?: string, data?: Dict, offsetX = 0, offsetY = 0) => {
      const { x, y } = getViewportCenter(rfInstance);
      const position = {
        x: x - 200 + offsetX,
        y: y - 100 + offsetY,
      };
      addNode(id, type ?? id, data ?? {}, position.x, position.y);
    },
    [rfInstance, addNode],
  );

  const addGroupNode = useCallback(
    (data: GroupNodeData) => {
      const { x, y } = getViewportCenter(rfInstance);
      addNode(`groupNode-${uuid()}`, "groupNode", {
        ...data,
        position: { x, y },
      });
    },
    [rfInstance, addNode],
  );

  // Add this with the other node addition functions
  const addDynamicPromptNode = (promptData: any) => {
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
  };

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

  const addTextFieldsNode = () => addNode("textFieldsNode", "textfields");
  const addProjectNode = () =>
    addNode("projectNode", "project", { projects: projects, tasks: tasks });
  const addTaskNode = () => addNode("taskNode", "task", { tasks: tasks });
  const addPromptNode = () => addNode("promptNode", "prompt", { prompt: "" });
  const addChatTurnNode = () => addNode("chatTurn", "chat", { prompt: "" });
  const addSimpleEvalNode = () => addNode("simpleEval", "simpleval");
  const addEvalNode = (progLang: string) => {
    let code = "";
    if (progLang === "python") {
      code = "def evaluate(response):\n  return len(response.text)";
    } else if (progLang === "javascript") {
      code = "function evaluate(response) {\n  return response.text.length;\n}";
    }
    addNode("evalNode", "evaluator", { language: progLang, code });
  };
  const addVisNode = () => addNode("visNode", "vis", {});
  const addInspectNode = () => addNode("inspectNode", "inspect");
  const addScriptNode = () => addNode("scriptNode", "script");
  const addItemsNode = () => addNode("csvNode", "csv");
  const addTabularDataNode = () => addNode("table");
  const addCommentNode = () => addNode("comment");
  const addLLMEvalNode = () => addNode("llmeval");
  const addMultiEvalNode = () => addNode("multieval");
  const addJoinNode = () => addNode("join");
  const addSplitNode = () => addNode("split");
  const addProcessorNode = (progLang: string) => {
    let code = "";
    if (progLang === "python")
      code = "def process(response):\n  return response.text;";
    else if (progLang === "javascript")
      code = "function process(response) {\n  return response.text;\n}";
    addNode("process", "processor", { language: progLang, code });
  };

  return {
    addTextFieldsNode,
    addProjectNode,
    addTaskNode,
    addPromptNode,
    addChatTurnNode,
    addProcessorNode,
    addLLMEvalNode,
    addSimpleEvalNode,
    addEvalNode,
    addMultiEvalNode,
    addVisNode,
    addInspectNode,
    addScriptNode,
    addItemsNode,
    addTabularDataNode,
    addCommentNode,
    addJoinNode,
    addSplitNode,
    addGroupNode,
    addDynamicPromptNode,
    organizePromptsByCategory,
  };
};
