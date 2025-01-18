import { useCallback } from "react";
import { useStore } from "../store/store";
import { Dict } from "../backend/typing";
import { getViewportCenter, createNode } from "../utils/app";
import { ReactFlowInstance } from "reactflow";

export const useNodeCreation = (rfInstance: ReactFlowInstance | null) => {
  const addNode = useStore((state) => state.addNode);

  const createNodeAtCenter = useCallback(
    (id: string, type?: string, data?: Dict, offsetX = 0, offsetY = 0) => {
      const { x, y } = getViewportCenter(rfInstance);
      const position = {
        x: x - 200 + offsetX,
        y: y - 100 + offsetY,
      };
      addNode(createNode(id, type ?? id, data ?? {}, position));
    },
    [rfInstance, addNode],
  );

  return {
    addTextFieldsNode: () => createNodeAtCenter("textFieldsNode", "textfields"),
    addProjectNode: () => createNodeAtCenter("projectNode", "project"),
    addTaskNode: () => createNodeAtCenter("taskNode", "task"),
    addPromptNode: () =>
      createNodeAtCenter("promptNode", "prompt", { prompt: "" }),
    addLLMNode: () => createNodeAtCenter("llmNode", "llm"),
    addSimpleEvalNode: () => createNodeAtCenter("simpleEvalNode", "simpleval"),
    addCodeEvaluatorNode: () =>
      createNodeAtCenter("codeEvaluatorNode", "evaluator"),
    addLLMEvaluatorNode: () =>
      createNodeAtCenter("llmEvaluatorNode", "llmeval"),
    addMultiEvalNode: () => createNodeAtCenter("multiEvalNode", "multieval"),
    addVisNode: () => createNodeAtCenter("visNode", "vis"),
    addInspectNode: () => createNodeAtCenter("inspectNode", "inspect"),
    addScriptNode: () => createNodeAtCenter("scriptNode", "script"),
    addItemsNode: () => createNodeAtCenter("itemsNode", "csv"),
    addTabularDataNode: () => createNodeAtCenter("tabularDataNode", "table"),
    addCommentNode: () => createNodeAtCenter("commentNode", "comment"),
    addJoinNode: () => createNodeAtCenter("joinNode", "join"),
    addSplitNode: () => createNodeAtCenter("splitNode", "split"),
    addGroupNode: () => createNodeAtCenter("groupNode", "groupNode"),
    addDynamicPromptNode: () =>
      createNodeAtCenter("dynamicPromptNode", "dynamicprompt"),
  };
};
