import { Flow, FlowSnapshot } from "../types/flow";
import StorageCache from "../backend/cache";
import { v4 as uuid } from "uuid";

const FLOWS_KEY = "chainforge-flows";
const SNAPSHOTS_KEY = "chainforge-snapshots";
const MIGRATION_KEY = "chainforge-flows-migrated";

export class FlowService {
  private static migrateFlowIds(): void {
    // Force re-migration if we're seeing duplicate keys
    const flows = JSON.parse(localStorage.getItem(FLOWS_KEY) || "[]");
    const snapshots = JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || "[]");

    // Check for duplicates
    const flowIds = new Set();
    let hasDuplicates = false;
    flows.forEach((flow: Flow) => {
      if (flowIds.has(flow.id)) {
        hasDuplicates = true;
      }
      flowIds.add(flow.id);
    });

    // If we have duplicates or haven't migrated yet, perform migration
    if (hasDuplicates || localStorage.getItem(MIGRATION_KEY) !== "true") {
      console.log("Starting flow ID migration...");
      let needsMigration = false;

      // Create a map to track ID changes
      const idMap = new Map();

      // First pass: identify duplicates and old format IDs
      const timestampPattern = /^flow-\d{13}$/;
      const snapshotTimestampPattern = /^snapshot-\d{13}$/;

      // Deduplicate and migrate flows
      const seenFlows = new Map();
      const migratedFlows = flows.map((flow: Flow) => {
        // Generate new ID if it's a duplicate or old format
        if (seenFlows.has(flow.id) || timestampPattern.test(flow.id)) {
          needsMigration = true;
          const newId = `flow-${uuid()}`;
          idMap.set(flow.id, newId);
          seenFlows.set(newId, flow);
          return { ...flow, id: newId };
        }
        seenFlows.set(flow.id, flow);
        return flow;
      });

      // Deduplicate by taking only the latest version of each flow
      const uniqueFlows = Array.from(seenFlows.values());

      // Update snapshots with new flow IDs and migrate snapshot IDs
      const migratedSnapshots = snapshots.map((snapshot: FlowSnapshot) => {
        const newFlowId = idMap.get(snapshot.flowId);
        if (newFlowId || snapshotTimestampPattern.test(snapshot.id)) {
          needsMigration = true;
          return {
            ...snapshot,
            id: snapshotTimestampPattern.test(snapshot.id)
              ? `snapshot-${uuid()}`
              : snapshot.id,
            flowId: newFlowId || snapshot.flowId,
          };
        }
        return snapshot;
      });

      if (needsMigration) {
        // Save the migrated data
        this.saveFlows(uniqueFlows);
        this.saveSnapshots(migratedSnapshots);
        console.log("Completed flow and snapshot ID migration");
      }

      // Mark migration as complete
      localStorage.setItem(MIGRATION_KEY, "true");
    }
  }

  public static getFlows(): Flow[] {
    this.migrateFlowIds();
    return JSON.parse(localStorage.getItem(FLOWS_KEY) || "[]");
  }

  public static saveFlows(flows: Flow[]): void {
    localStorage.setItem(FLOWS_KEY, JSON.stringify(flows));
  }

  public static getSnapshots(): FlowSnapshot[] {
    this.migrateFlowIds();
    return JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || "[]");
  }

  public static saveSnapshots(snapshots: FlowSnapshot[]): void {
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
  }

  static createFlow(
    name: string,
    description?: string,
    isDefault = false,
  ): Flow {
    const flows = this.getFlows();
    const newFlow: Flow = {
      id: `flow-${uuid()}`,
      name,
      description,
      isDefault,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      },
    };

    flows.push(newFlow);
    this.saveFlows(flows);
    return newFlow;
  }

  static updateFlow(id: string, flowData: Partial<Flow>): Flow {
    const flows = this.getFlows();
    const index = flows.findIndex((f) => f.id === id);
    if (index === -1) throw new Error("Flow not found");

    const updatedFlow = {
      ...flows[index],
      ...flowData,
      version: flows[index].version + 1,
      updatedAt: new Date().toISOString(),
    };

    flows[index] = updatedFlow;
    this.saveFlows(flows);
    return updatedFlow;
  }

  static deleteFlow(id: string): void {
    const flows = this.getFlows();
    const flow = flows.find((f) => f.id === id);
    if (!flow) throw new Error("Flow not found");
    if (flow.isDefault) throw new Error("Cannot delete default flow");

    this.saveFlows(flows.filter((f) => f.id !== id));
  }

  static createSnapshot(
    flowId: string,
    name?: string,
    description?: string,
  ): FlowSnapshot {
    console.log("Creating snapshot for flow:", flowId);
    const flows = this.getFlows();
    const flow = flows.find((f) => f.id === flowId);
    if (!flow) {
      console.error("Flow not found:", flowId);
      throw new Error("Flow not found");
    }

    const snapshots = this.getSnapshots();
    const snapshot: FlowSnapshot = {
      id: `snapshot-${uuid()}`,
      flowId,
      version: flow.version,
      name: name || `Snapshot ${new Date().toLocaleString()}`,
      description,
      createdAt: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(flow.data)), // Deep clone to prevent reference issues
      cache: flow.cache ? JSON.parse(JSON.stringify(flow.cache)) : undefined,
    };

    console.log("Created snapshot:", snapshot);
    snapshots.push(snapshot);
    this.saveSnapshots(snapshots);
    return snapshot;
  }

  static restoreSnapshot(snapshotId: string): Flow {
    console.log("Restoring snapshot:", snapshotId);
    const snapshots = this.getSnapshots();
    const snapshot = snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) {
      console.error("Snapshot not found:", snapshotId);
      throw new Error("Snapshot not found");
    }

    console.log("Found snapshot:", snapshot);
    const restoredFlow = this.updateFlow(snapshot.flowId, {
      data: JSON.parse(JSON.stringify(snapshot.data)), // Deep clone
      cache: snapshot.cache
        ? JSON.parse(JSON.stringify(snapshot.cache))
        : undefined,
      version: snapshot.version,
    });

    console.log("Restored flow:", restoredFlow);
    return restoredFlow;
  }

  static initializeDefaultFlows(): void {
    this.migrateFlowIds();
    this.cleanupDuplicateFlows();
    const flows = this.getFlows();
    if (flows.length === 0) {
      // Create default flows
      this.createFlow("Empty Flow", "A blank flow", true);
      this.createFlow(
        "Basic Prompt Flow",
        "A simple prompt with text input",
        true,
      );
    }
  }

  // Add a method to force remigration if needed
  public static forceMigration(): void {
    localStorage.removeItem(MIGRATION_KEY);
    this.migrateFlowIds();
  }

  public static cleanupDuplicateFlows(): void {
    const flows = this.getFlows();
    const uniqueFlows = new Map();
    const duplicates = new Set();

    // First pass: identify duplicates based on content
    flows.forEach((flow) => {
      const contentKey = JSON.stringify(flow.data);
      if (uniqueFlows.has(contentKey)) {
        // This is a duplicate
        const existingFlow = uniqueFlows.get(contentKey);
        // Keep the newer version
        if (new Date(flow.updatedAt) > new Date(existingFlow.updatedAt)) {
          duplicates.add(existingFlow.id);
          uniqueFlows.set(contentKey, flow);
        } else {
          duplicates.add(flow.id);
        }
      } else {
        uniqueFlows.set(contentKey, flow);
      }
    });

    // Remove duplicates
    if (duplicates.size > 0) {
      const cleanedFlows = flows.filter((flow) => !duplicates.has(flow.id));
      this.saveFlows(cleanedFlows);
      console.log(`Removed ${duplicates.size} duplicate flows`);
    }
  }
}
