import { ReactFlowInstance, Node, Edge } from "reactflow";
import { Flow } from "./flow";
import { LLMSpec } from "../backend/typing";

export interface AppState {
  nodes: Node[];
  edges: Edge[];
  rfInstance: ReactFlowInstance | null;
  currentFlow: Flow | null;
  selectedNodes: string[];
  apiKeys: Record<string, string>;
  projects: any[]; // Define proper type
  tasks: any[]; // Define proper type
}

export interface AppActions {
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setRfInstance: (instance: ReactFlowInstance | null) => void;
  setCurrentFlow: (flow: Flow | null) => void;
  setSelectedNodes: (nodeIds: string[]) => void;
  setAPIKeys: (keys: Record<string, string>) => void;
  setProjects: (projects: any[]) => void;
  setTasks: (tasks: any[]) => void;
}
