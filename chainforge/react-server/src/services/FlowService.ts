import { Flow, FlowData } from "../types/flow";
import { v4 as uuid } from "uuid";
import StorageCache from "../backend/cache";

export interface Snapshot {
  id: string;
  flowId: string;
  name: string;
  description?: string;
  version: string;
  data: FlowData;
  createdAt: string;
}

export class FlowService {
  private static readonly FLOWS_KEY = "chainforge-flows";
  private static readonly SNAPSHOTS_KEY = "chainforge-snapshots";
  private static readonly MIGRATION_KEY = "flow-id-migration";

  static getFlows(): Flow[] {
    return JSON.parse(localStorage.getItem(this.FLOWS_KEY) || "[]");
  }

  static createFlow(name: string, description?: string): Flow {
    const flow: Flow = {
      id: `flow-${uuid()}`,
      name,
      description,
      data: {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        groups: [],
      },
      cache: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: "1.0",
    };

    const flows = this.getFlows();
    flows.push(flow);
    localStorage.setItem(this.FLOWS_KEY, JSON.stringify(flows));

    return flow;
  }

  static forceMigration(): void {
    const flows = this.getFlows();
    flows.forEach((flow) => {
      flow.id = `flow-${uuid()}`;
    });
    localStorage.setItem(this.FLOWS_KEY, JSON.stringify(flows));
  }

  static initializeDefaultFlows(): void {
    const flows = this.getFlows();
    if (flows.length === 0) {
      this.createFlow("Empty Flow", "A blank flow");
      this.createFlow("Basic Prompt Flow", "A simple prompt with text input");
    }
  }

  static updateFlow(flowId: string, flowData: Partial<Flow>): Flow {
    const flows = this.getFlows();
    const index = flows.findIndex((f) => f.id === flowId);
    if (index === -1) throw new Error("Flow not found");

    const updatedFlow = {
      ...flows[index],
      ...flowData,
      updatedAt: new Date().toISOString(),
    };

    flows[index] = updatedFlow;
    localStorage.setItem(this.FLOWS_KEY, JSON.stringify(flows));
    return updatedFlow;
  }

  static deleteFlow(flowId: string): void {
    const flows = this.getFlows();
    const updatedFlows = flows.filter((f) => f.id !== flowId);
    localStorage.setItem(this.FLOWS_KEY, JSON.stringify(updatedFlows));
  }

  static getSnapshots(): Snapshot[] {
    return JSON.parse(localStorage.getItem(this.SNAPSHOTS_KEY) || "[]");
  }

  static createSnapshot(
    flowId: string,
    name?: string,
    description?: string,
  ): Snapshot {
    const flow = this.getFlows().find((f) => f.id === flowId);
    if (!flow) throw new Error("Flow not found");

    const snapshot: Snapshot = {
      id: `snapshot-${uuid()}`,
      flowId,
      name: name || `Snapshot ${new Date().toLocaleString()}`,
      description,
      version: flow.version || "1.0",
      data: flow.data,
      createdAt: new Date().toISOString(),
    };

    const snapshots = this.getSnapshots();
    snapshots.push(snapshot);
    localStorage.setItem(this.SNAPSHOTS_KEY, JSON.stringify(snapshots));

    return snapshot;
  }
}
