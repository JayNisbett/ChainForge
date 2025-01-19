import { Flow, FlowData, FlowSnapshot } from "../types/flow";
import { v4 as uuid } from "uuid";
import { fetchDefaultFlows } from "../backend/backend";
import { Dict } from "../backend/typing";

export class FlowService {
  private static readonly FLOWS_KEY = "chainforge-flows";
  private static readonly SNAPSHOTS_KEY = "chainforge-snapshots";
  private static readonly CURRENT_FLOW_KEY = "chainforge-current-flow";

  static getFlows(): Flow[] {
    const flows = JSON.parse(localStorage.getItem(this.FLOWS_KEY) || "[]");
    return flows.map((flow: Flow) => ({
      ...flow,
      isDefault: flow.isDefault || false,
      version: flow.version || "1.0.0",
    }));
  }

  static getCurrentFlow(): Flow | null {
    const flowId = localStorage.getItem(this.CURRENT_FLOW_KEY);
    if (!flowId) return null;
    return this.getFlows().find((f) => f.id === flowId) || null;
  }

  static setCurrentFlow(flowId: string | null): void {
    if (flowId) {
      localStorage.setItem(this.CURRENT_FLOW_KEY, flowId);
    } else {
      localStorage.removeItem(this.CURRENT_FLOW_KEY);
    }
  }

  static createFlow(
    name: string,
    description?: string,
    isDefault = false,
  ): Flow {
    const flow: Flow = {
      id: `flow-${uuid()}`,
      name,
      description,
      isDefault,
      version: "1.0.0",
      data: {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        groups: [],
      },
      cache: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const flows = this.getFlows();
    flows.push(flow);
    localStorage.setItem(this.FLOWS_KEY, JSON.stringify(flows));
    this.setCurrentFlow(flow.id);

    return flow;
  }

  static updateFlow(flowId: string, updates: Partial<Flow>): Flow {
    const flows = this.getFlows();
    const index = flows.findIndex((f) => f.id === flowId);
    if (index === -1) throw new Error("Flow not found");

    if (flows[index].isDefault) {
      throw new Error("Cannot modify default flow");
    }

    // Increment version for significant changes
    const versionParts = flows[index].version?.split(".") || ["1", "0", "0"];
    const newVersion = `${versionParts[0]}.${Number(versionParts[1]) + 1}.0`;

    const updatedFlow = {
      ...flows[index],
      ...updates,
      version: newVersion,
      updatedAt: new Date().toISOString(),
    };

    flows[index] = updatedFlow;
    localStorage.setItem(this.FLOWS_KEY, JSON.stringify(flows));
    return updatedFlow;
  }

  static saveFlowData(id: string, data: FlowData, cache?: Dict<string>): Flow {
    const flow = this.getFlows().find((f) => f.id === id);
    if (!flow) throw new Error("Flow not found");

    return this.updateFlow(id, {
      ...flow,
      data,
      cache,
      updatedAt: new Date().toISOString(),
    });
  }

  static async initializeDefaultFlows(): Promise<void> {
    const flows = this.getFlows();
    const defaultFlows = await fetchDefaultFlows();

    for (const defaultFlow of defaultFlows) {
      // check if the flow already exists
      let flow = flows.find((f) => f.name === defaultFlow.name);
      if (!flow) {
        flow = this.createFlow(defaultFlow.name, defaultFlow.description, true);
        // Update the flow with the template data
        this.updateFlow(flow.id, {
          ...flow,
          data: defaultFlow.data,
        });
      }
    }
  }

  // Enhanced snapshot methods
  static getSnapshots(flowId?: string): FlowSnapshot[] {
    const snapshots = JSON.parse(
      localStorage.getItem(this.SNAPSHOTS_KEY) || "[]",
    );
    return flowId
      ? snapshots.filter((s: FlowSnapshot) => s.flowId === flowId)
      : snapshots;
  }

  static createSnapshot(
    flowId: string,
    name?: string,
    description?: string,
  ): FlowSnapshot {
    const flow = this.getFlows().find((f) => f.id === flowId);
    if (!flow) throw new Error("Flow not found");

    const snapshot: FlowSnapshot = {
      id: `snapshot-${uuid()}`,
      flowId,
      name: name || `Snapshot ${new Date().toLocaleString()}`,
      description,
      version: flow.version,
      data: flow.data,
      cache: flow.cache,
      createdAt: new Date().toISOString(),
    };

    const snapshots = this.getSnapshots();
    snapshots.push(snapshot);
    localStorage.setItem(this.SNAPSHOTS_KEY, JSON.stringify(snapshots));

    return snapshot;
  }

  static restoreSnapshot(snapshotId: string): Flow {
    const snapshot = this.getSnapshots().find((s) => s.id === snapshotId);
    if (!snapshot) throw new Error("Snapshot not found");

    const flow = this.getFlows().find((f) => f.id === snapshot.flowId);
    if (!flow) throw new Error("Original flow not found");

    return this.updateFlow(flow.id, {
      data: snapshot.data,
      cache: snapshot.cache,
      version: `${flow.version}.snapshot`,
    });
  }

  static deleteFlow(flowId: string): void {
    const flows = this.getFlows();
    const flow = flows.find((f) => f.id === flowId);

    if (!flow) throw new Error("Flow not found");
    if (flow.isDefault) throw new Error("Cannot delete default flow");

    // Remove current flow reference if we're deleting the current flow
    if (flowId === localStorage.getItem(this.CURRENT_FLOW_KEY)) {
      this.setCurrentFlow(null);
    }

    // Delete all snapshots associated with this flow
    const snapshots = this.getSnapshots();
    const updatedSnapshots = snapshots.filter((s) => s.flowId !== flowId);
    localStorage.setItem(this.SNAPSHOTS_KEY, JSON.stringify(updatedSnapshots));

    // Delete the flow
    const updatedFlows = flows.filter((f) => f.id !== flowId);
    localStorage.setItem(this.FLOWS_KEY, JSON.stringify(updatedFlows));
  }
}
