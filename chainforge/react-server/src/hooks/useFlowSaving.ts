import { useCallback } from "react";
import { ReactFlowInstance } from "reactflow";
import { FlowService } from "../services/FlowService";
import { Flow, FlowData } from "../types/flow";
import StorageCache from "../backend/cache";

export const useFlowSaving = (currentFlow: Flow | null) => {
  const saveFlow = useCallback(
    (rfInstance: ReactFlowInstance) => {
      if (!currentFlow) return;

      // Get the current flow state
      const flowData: FlowData = {
        nodes: rfInstance.getNodes(),
        edges: rfInstance.getEdges(),
        viewport: rfInstance.getViewport(),
        groups: currentFlow.data.groups || [],
      };

      // Update the flow with new data
      const updatedFlow = {
        ...currentFlow,
        data: flowData,
        cache: StorageCache.getAllMatching((key) => key.includes("prompt")),
        updatedAt: new Date().toISOString(),
      };

      // Save to local storage
      FlowService.updateFlow(currentFlow.id, updatedFlow);
    },
    [currentFlow],
  );

  return { saveFlow };
};
