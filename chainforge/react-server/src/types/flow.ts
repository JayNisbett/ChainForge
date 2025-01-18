import { Node, Edge, Viewport } from "reactflow";
import { Dict } from "./common";

export interface Group {
  id: string;
  name: string;
  description?: string;
  nodes: string[]; // IDs of nodes in the group
  isCollapsed?: boolean;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface FlowData {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  groups?: Group[];
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  data: FlowData;
  cache: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  version: string;
  isDefault?: boolean;
}

export interface FlowSnapshot {
  id: string;
  flowId: string;
  version: number;
  name?: string;
  description?: string;
  createdAt: string;
  data: Flow["data"];
  cache?: any;
}
