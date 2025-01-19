import { useState, useCallback, useContext } from "react";
import { ReactFlowInstance, Node, Edge } from "reactflow";
import { Flow, FlowData, FlowSnapshot } from "../types/flow";
import { FlowService } from "../services/FlowService";
import useStore from "../store/store";
import StorageCache from "../backend/cache";
import { useFlowActions } from "./useFlowActions";
import { handleError } from "../utils/errorHandling";
import { fetchExampleFlow } from "../backend/backend";
import { downloadJSON } from "../utils/app";
import { AlertContext } from "../components/AlertProvider";
import { useNodeCreation } from "./useNodeCreation";
import { ModelSettingsModalRef } from "../components/ai/models/ModelSettingsModal";

export function useFlowManagement() {
  const [currentFlow, setCurrentFlow] = useState<Flow | null>(() =>
    FlowService.getCurrentFlow(),
  );
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const {
    setNodes,
    setEdges,
    setGroups,
    setViewport,
    restoreCache,
    nodes,
    edges,
    groups,
    selectedNodes,
  } = useStore((state) => ({
    setNodes: state.setNodes,
    setEdges: state.setEdges,
    setGroups: state.setGroups,
    setViewport: state.setViewport,
    restoreCache: state.restoreCache,
    nodes: state.nodes,
    edges: state.edges,
    groups: state.groups,
    selectedNodes: state.selectedNodes,
  }));

  const { addGroupNode } = useNodeCreation(rfInstance);

  const showAlert = useContext(AlertContext);

  const loadFlow = useCallback(
    (flowId: string) => {
      console.log("loadFlow", flowId);
      console.log("flows", FlowService.getFlows());
      const flow = FlowService.getFlows().find((f) => f.id === flowId);
      if (!flow) {
        console.warn(`Flow not found with ID: ${flowId}`);
        return;
      }
      /*
      // Clear existing state
      setNodes([]);
      setEdges([]);
      setGroups([]); */

      // Set timeout to ensure clear happens first
      setTimeout(() => {
        setNodes(flow.data.nodes || []);
        setEdges(flow.data.edges || []);
        setViewport(flow.data.viewport || { x: 0, y: 0, zoom: 1 });
        setGroups(flow.data.groups || []);

        if (flow.cache) {
          restoreCache(flow.cache);
        }

        setCurrentFlow(flow);
        FlowService.setCurrentFlow(flow.id);
        rfInstance?.fitView();
      }, 0);
    },
    [rfInstance, setNodes, setEdges, setViewport, setGroups, restoreCache],
  );

  const createFlow = useCallback((name: string, description?: string) => {
    const flow = FlowService.createFlow(name, description);
    setCurrentFlow(flow);
    return flow;
  }, []);

  const deleteFlow = useCallback(
    (flowId: string) => {
      if (currentFlow?.id === flowId) {
        resetFlow();
      }
      FlowService.deleteFlow(flowId);
    },
    [currentFlow],
  );

  const resetFlow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setGroups([]);
    setCurrentFlow(null);
  }, [setNodes, setEdges, setGroups]);

  const createSnapshot = useCallback(
    (name?: string) => {
      if (!currentFlow) return;

      const snapshot = FlowService.createSnapshot(
        currentFlow.id,
        name || `Snapshot ${new Date().toLocaleString()}`,
      );

      return snapshot;
    },
    [currentFlow],
  );

  const restoreSnapshot = useCallback(
    (snapshotId: string) => {
      const snapshot = FlowService.getSnapshots().find(
        (s) => s.id === snapshotId,
      );
      if (!snapshot) return;

      loadFlow(snapshot.flowId);
    },
    [loadFlow],
  );

  // Update the importFlowFromJSON function to set the current flow
  const importFlowFromJSON = useCallback(
    (flowData: any, rf_inst: ReactFlowInstance) => {
      try {
        // Create a new flow from the imported data
        const newFlow = FlowService.createFlow(
          "Imported Flow",
          "Imported from JSON",
        );

        console.log("newFlow", newFlow);

        // Convert ReactFlow data to our Flow data structure
        const flowDataFormatted: FlowData = {
          nodes: flowData.flow.nodes,
          edges: flowData.flow.edges,
          viewport: flowData.flow.viewport || { x: 0, y: 0, zoom: 1 },
          groups: flowData.flow.groups || [],
        };

        newFlow.data = flowDataFormatted;
        newFlow.cache = flowData.cache;

        setCurrentFlow(newFlow);
        FlowService.updateFlow(newFlow.id, newFlow);

        // Update the ReactFlow instance
        setNodes(flowDataFormatted.nodes);
        setEdges(flowDataFormatted.edges);
        if (rf_inst && flowDataFormatted.viewport) {
          rf_inst.setViewport(flowDataFormatted.viewport);
        }
      } catch (err) {
        handleError(err);
      }
    },
    [setNodes, setEdges, handleError, setCurrentFlow],
  );

  // Add this with other callback functions
  const onSelectExampleFlow = useCallback(
    async (flowId: string) => {
      try {
        const flowData = await fetchExampleFlow(flowId);
        if (flowData && rfInstance) {
          importFlowFromJSON(flowData, rfInstance);
        }
      } catch (err) {
        handleError(err);
      }
    },
    [rfInstance, importFlowFromJSON],
  );

  // Add these with other flow-related functions
  const exportFlow = useCallback(() => {
    if (!rfInstance || !currentFlow) return;

    const flow = rfInstance.toObject();
    const exportData = {
      flow,
      cache: StorageCache.getAllMatching((key) => key.startsWith("r.")),
    };

    downloadJSON(
      exportData,
      `chainforge-flow-${currentFlow.name}-${Date.now()}.json`,
    );
  }, [rfInstance, currentFlow]);

  const importFlowFromFile = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !rfInstance) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          importFlowFromJSON(jsonData, rfInstance);
        } catch (err) {
          handleError(err);
        }
      };
      reader.readAsText(file);
    };

    input.click();
  }, [rfInstance, importFlowFromJSON]);

  const handleCreateGroup = useCallback(
    (name: string, description?: string) => {
      if (!showAlert) return;
      if (!Array.isArray(nodes)) {
        console.error("Nodes is not an array");
        return;
      }
      if (selectedNodes.length < 2) {
        showAlert("Select at least 2 nodes to create a group");
        return;
      }

      // Create the group
      const groupId = useStore.getState().createGroup(name, description);

      // Get information about grouped nodes
      const groupedNodes = nodes.filter((n) =>
        selectedNodes.includes(typeof n.id === "string" ? n.id : String(n.id)),
      );

      const nodeConnections = Array.isArray(edges)
        ? edges.filter(
            (e) =>
              selectedNodes.includes(
                typeof e.source === "string" ? e.source : String(e.source),
              ) ||
              selectedNodes.includes(
                typeof e.target === "string" ? e.target : String(e.target),
              ),
          )
        : [];

      // Calculate center position of selected nodes
      const centerX =
        groupedNodes.reduce((sum, node) => sum + node.position.x, 0) /
        groupedNodes.length;
      const centerY =
        groupedNodes.reduce((sum, node) => sum + node.position.y, 0) /
        groupedNodes.length;

      // Clear selection before modifying nodes
      useStore.getState().setSelectedNodes([]);

      // Remove selected nodes and their edges
      setNodes((currentNodes: Node[]) =>
        currentNodes.filter((n) => !selectedNodes.includes(n.id)),
      );

      setEdges((currentEdges: Edge[]) =>
        currentEdges.filter(
          (e) =>
            !selectedNodes.includes(e.source) &&
            !selectedNodes.includes(e.target),
        ),
      );

      // Add group node
      addGroupNode({
        name,
        description,
        groupId,
        nodes: groupedNodes.map((n) => ({
          id: n.id,
          type: n.type || "",
          name: n.data?.name || n.type,
        })),
        connections: nodeConnections.map((e) => ({
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle || undefined,
          targetHandle: e.targetHandle || undefined,
        })),
        isCollapsed: false,
      });
    },
    [selectedNodes, nodes, edges, addGroupNode, setNodes, setEdges, showAlert],
  );

  const handleCreateFlowFromSelection = useCallback(
    (name: string, description?: string) => {
      if (!showAlert) return;
      if (selectedNodes.length < 2) {
        showAlert("Select at least 2 nodes to create a flow");
        return;
      }

      // Create new flow from selection
      const newFlowId = useStore
        .getState()
        .createFlowFromSelection(name, description);

      // Create a group node that references this flow
      addGroupNode({
        name,
        description,
        referencedFlowId: newFlowId,
        nodes: selectedNodes.map((nodeId) => ({
          id: nodeId,
          type: nodes.find((n) => n.id === nodeId)?.type || "",
          name: nodes.find((n) => n.id === nodeId)?.data?.name || "",
        })),
      });
    },
    [selectedNodes, nodes, addGroupNode, showAlert],
  );

  // Add saving functionality (from useFlowSaving)
  const saveFlow = useCallback(() => {
    if (!currentFlow || !rfInstance) return;

    console.log("saveFlow", currentFlow);

    const flowData: FlowData = {
      nodes: rfInstance.getNodes(),
      edges: rfInstance.getEdges(),
      viewport: rfInstance.getViewport(),
      groups: useStore.getState().groups,
    };

    const cache = StorageCache.getAllMatching((key) => key.includes("prompt"));

    const updatedFlow = FlowService.saveFlowData(
      currentFlow.id,
      flowData,
      cache,
    );
    setCurrentFlow(updatedFlow);
  }, [currentFlow, rfInstance]);

  // Add flow actions (from useFlowActions)
  const onClickSettings = useCallback(
    (settingsModal: ModelSettingsModalRef) => {
      settingsModal.trigger();
    },
    [],
  );

  return {
    currentFlow,
    setCurrentFlow,
    rfInstance,
    setRfInstance,
    loadFlow,
    createFlow,
    deleteFlow,
    resetFlow,
    createSnapshot,
    restoreSnapshot,
    onSelectExampleFlow,
    exportFlow,
    importFlowFromFile,
    importFlowFromJSON,
    handleCreateGroup,
    handleCreateFlowFromSelection,
    saveFlow,
    onClickSettings,
  };
}
