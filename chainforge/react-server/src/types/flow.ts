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
  isDefault?: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  data: FlowData;
  cache?: Dict<any>;
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
