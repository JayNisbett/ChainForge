import { v4 as uuid } from "uuid";
import { Dict } from "../backend/typing";

interface PromptData {
  _id: string;
  title: string;
  categoryRef: number;
  fields: any[];
  outputFormat: string;
  displayButton?: any[];
  stream?: boolean;
}

export const generatePromptNodeData = (promptData: PromptData): Dict => {
  return {
    _id: promptData._id || uuid(),
    title: promptData.title || "Dynamic Prompt",
    categoryRef: promptData.categoryRef,
    fields: promptData.fields || [],
    outputFormat: promptData.outputFormat,
    displayButton: promptData.displayButton,
    stream: promptData.stream,
  };
};

// Function to add multiple prompt nodes from JSON data
export const addPromptNodesFromData = (
  promptDataArray: PromptData[],
  addNodeFunc: (
    id: string,
    type: string,
    data: Dict,
    offsetX?: number,
    offsetY?: number,
  ) => void,
  startPosition = { x: 50, y: 50 },
  spacing = { x: 300, y: 200 },
) => {
  promptDataArray.forEach((promptData, index) => {
    const offsetX = startPosition.x + (index % 3) * spacing.x;
    const offsetY = startPosition.y + Math.floor(index / 3) * spacing.y;

    addNodeFunc(
      "dynamicPromptNode",
      "dynamicprompt",
      generatePromptNodeData(promptData),
      offsetX,
      offsetY,
    );
  });
};
