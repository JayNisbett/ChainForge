import { Node, Edge, Viewport } from "reactflow";
import { Dict } from "./common";

export interface Group {
  id: string;
  name: string;
  description?: string;
  nodes: string[]; // IDs of nodes in the group
  isCollapsed: boolean;
}

export interface FlowData {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  groups: Group[];
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  version?: string;
  isDefault?: boolean; // Flag for default flows
  data: FlowData;
  cache?: Dict<string>;
  createdAt: string;
  updatedAt: string;
}

export interface FlowSnapshot {
  id: string;
  name: string;
  description?: string;
  version?: string;
  flowId: string;
  data: FlowData;
  cache?: Dict<string>;
  createdAt: string;
}
