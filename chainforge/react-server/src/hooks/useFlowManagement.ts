import { useState, useCallback } from "react";
import { ReactFlowInstance } from "reactflow";
import { Flow } from "../types/flow";
import { FlowService } from "../services/FlowService";
import StorageCache from "../backend/cache";
import useStore from "../store/store";

export const useFlowManagement = () => {
  const [currentFlow, setCurrentFlow] = useState<Flow | null>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const { setNodes, setEdges } = useStore((state) => ({
    setNodes: state.setNodes,
    setEdges: state.setEdges,
  }));

  const resetFlow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setCurrentFlow(null);
    StorageCache.clear();

    // Reset viewport
    if (rfInstance) {
      rfInstance.setViewport({ x: 0, y: 0, zoom: 1 });
    }

    // Create a new empty flow if none exists
    if (!currentFlow) {
      const newFlow = FlowService.createFlow("New Flow", "Empty flow");
      setCurrentFlow(newFlow);
    }
  }, [setNodes, setEdges, rfInstance, currentFlow]);

  return {
    currentFlow,
    setCurrentFlow,
    rfInstance,
    setRfInstance,
    resetFlow,
  };
};
