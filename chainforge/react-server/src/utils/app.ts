import { ReactFlowInstance } from "reactflow";
import { StoreHandles, useStore } from "../store/store";
import { Dict, LLMSpec } from "../backend/typing";
import {
  isMobile,
  isChrome,
  isFirefox,
  isEdgeChromium,
  isChromium,
} from "react-device-detect";
import {
  getDefaultModelFormData,
  getDefaultModelSettings,
} from "../components/ai/models/ModelSettingSchemas";
import { APP_IS_RUNNING_LOCALLY } from "../backend/utils";
import { v4 as uuid } from "uuid";
import { FlowData } from "../types/flow";

// Constants and environment checks
export const IS_RUNNING_LOCALLY = APP_IS_RUNNING_LOCALLY();

export const IS_ACCEPTED_BROWSER =
  (isChrome ||
    isChromium ||
    isEdgeChromium ||
    isFirefox ||
    (navigator as any)?.brave !== undefined) &&
  !isMobile;

// Store selector
export const selector = (state: StoreHandles) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  addNode: state.addNode,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  resetLLMColors: state.resetLLMColors,
  setAPIKeys: state.setAPIKeys,
  importState: state.importState,
  selectedNodes: state.selectedNodes,
});

// Initial LLM configuration
export const INITIAL_LLM = (): LLMSpec => {
  if (!IS_RUNNING_LOCALLY) {
    return {
      id: uuid(),
      name: "Mistral-7B",
      emoji: "🤗",
      model: "mistralai/Mistral-7B-Instruct-v0.1",
      base_model: "hf",
      temp: 1.0,
      settings: getDefaultModelSettings("hf"),
      formData: getDefaultModelFormData("hf"),
    };
  } else {
    return {
      id: uuid(),
      name: "GPT3.5",
      emoji: "🤖",
      model: "gpt-3.5-turbo",
      base_model: "gpt-3.5-turbo",
      temp: 1.0,
      settings: getDefaultModelSettings("gpt-3.5-turbo"),
      formData: getDefaultModelFormData("gpt-3.5-turbo"),
    };
  }
};

// Viewport utilities
export const getWindowSize = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

export const getWindowCenter = () => {
  const { width, height } = getWindowSize();
  return { centerX: width / 2.0, centerY: height / 2.0 };
};

export const getViewportCenter = (rfInstance?: ReactFlowInstance | null) => {
  const { centerX, centerY } = getWindowCenter();
  if (!rfInstance) return { x: centerX, y: centerY };
  const { x, y, zoom } = rfInstance.getViewport();
  return { x: -(x / zoom) + centerX / zoom, y: -(y / zoom) + centerY / zoom };
};

// Node creation utilities
export const createNode = (
  id: string,
  type: string,
  data: Dict = {},
  position = { x: 0, y: 0 },
) => ({
  id: `${id}-${Date.now()}`,
  type,
  data,
  position,
});

// File utilities
export const downloadJSON = (jsonData: any, filename: string) => {
  const jsonString = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(downloadLink.href);
};

// URL utilities
export const getSharedFlowURLParam = () => {
  const curr_url = new URL(window.location.href);
  const params = new URLSearchParams(curr_url.search);
  const shared_flow_uid = params.get("f");
  if (shared_flow_uid) {
    const is_base36 = /^[0-9a-z]+$/i;
    if (shared_flow_uid.length > 1 && is_base36.test(shared_flow_uid)) {
      return shared_flow_uid;
    }
  }
  return undefined;
};
