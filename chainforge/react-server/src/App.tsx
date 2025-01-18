import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useContext,
} from "react";
import ReactFlow, {
  Controls,
  Background,
  ReactFlowInstance,
  Node,
  Edge,
  ReactFlowJsonObject,
} from "reactflow";
import { Button, LoadingOverlay } from "@mantine/core";
import { useClipboard, useHotkeys } from "@mantine/hooks";
import { useContextMenu } from "mantine-contextmenu";
import {
  IconSettings,
  IconTextPlus,
  IconTerminal,
  IconSettingsAutomation,
  IconFileSymlink,
  IconRobot,
  IconRuler2,
  IconArrowMerge,
  IconArrowsSplit,
  IconForms,
  IconAbacus,
  IconLayersSubtract,
  IconLayersIntersect,
} from "@tabler/icons-react";
import RemoveEdge from "./components/edges/RemoveEdge";
import GlobalSettingsModal, {
  GlobalSettingsModalRef,
} from "./components/modals/GlobalSettingsModal";
import ExampleFlowsModal, {
  ExampleFlowsModalRef,
} from "./components/modals/ExampleFlowsModal";
import AreYouSureModal, {
  AreYouSureModalRef,
} from "./components/modals/AreYouSureModal";

import {
  getDefaultModelFormData,
  getDefaultModelSettings,
} from "./components/ai/models/ModelSettingSchemas";
import { v4 as uuid } from "uuid";
import LZString from "lz-string";
import { EXAMPLEFLOW_1 } from "./components/flows/example_flows";

import { FlowManager } from "./components/FlowManager";
import { GroupModal, GroupModalRef } from "./components/modals/GroupModal";
import { AlertContext, AlertProvider } from "./components/AlertProvider";
import { SelectionActionMenu } from "./components/SelectionActionMenu";
import { FlowData, Flow } from "./types/flow";
import promptData from "./backend/aiPromptNodeData.json";
import { addPromptNodesFromData } from "./utils/nodeGenerator";
import promptCategoriesData from "./backend/aiPromptCategoriesData.json";
import MainMenu from "./components/menu/MainMenu";

// Styling
import "reactflow/dist/style.css"; // reactflow
import "./styles/text-fields-node.css"; // project

// Lazy loading images
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";

// State management (from https://reactflow.dev/docs/guides/state-management/)
import { shallow } from "zustand/shallow";
import useStore, { StoreHandles, Project } from "./store/store";
import StorageCache from "./backend/cache";
import { APP_IS_RUNNING_LOCALLY, browserTabIsActive } from "./backend/utils";
import { Dict, JSONCompatible, LLMSpec } from "./backend/typing";
import {
  exportCache,
  fetchEnvironAPIKeys,
  fetchExampleFlow,
  fetchOpenAIEval,
  importCache,
} from "./backend/backend";

// Device / Browser detection
import {
  isMobile,
  isChrome,
  isFirefox,
  isEdgeChromium,
  isChromium,
} from "react-device-detect";
import { handleError } from "./utils/errorHandling";
import { FlowService } from "./services/FlowService";
import {
  createSnapshot,
  IS_ACCEPTED_BROWSER,
  onClickNewFlow,
  onClickSettings,
  restoreSnapshot,
  selector,
} from "./utils/app";
import { nodeTypes, edgeTypes } from "./config/nodeRegistry";
import MenuTooltip from "./components/menu/MenuToolTip";
import ShareFlowButton from "./components/buttons/ShareFlow";
import CreateNewFlowButton from "./components/buttons/CreateFlow";
import ExampleFlowButton from "./components/buttons/ExampleFlow";
import { useVueUpdates } from "./hooks/useVueUpdates";
import { useFlowManagement } from "./hooks/useFlowManagement";
import { ControlButtons } from "./components/controls/ControlButtons";
import { useFlowInitialization } from "./hooks/useFlowInitialization";
import { useAutosaving } from "./hooks/useAutosaving";
import { CforgeData } from "./types/cache";
import { useFlowSaving } from "./hooks/useFlowSaving";
import { useNodeCreation } from "./hooks/useNodeCreation";

// const connectionLineStyle = { stroke: '#ddd' };
const snapGrid: [number, number] = [16, 16];

interface MountProps {
  initialPath?: string;
  initialData?: {
    projects?: any[];
    tasks?: any[];
  };
  onNavigate?: (
    args: { pathname: string } | { type: string; data: any },
  ) => void;
}

// Add type for custom event
interface VueUpdateEvent extends CustomEvent {
  detail: {
    type: string;
    data: any;
  };
}

const App = ({ initialData }: { initialData?: MountProps["initialData"] }) => {
  // Use the new hooks
  useVueUpdates();
  const { currentFlow, setCurrentFlow, rfInstance, setRfInstance, resetFlow } =
    useFlowManagement();
  const { saveFlow } = useFlowSaving(currentFlow);

  const setProjects = useStore((state) => state.setProjects);
  const setTasks = useStore((state) => state.setTasks);
  const projects = useStore((state) => state.projects);
  const tasks = useStore((state) => state.tasks);

  // Get nodes, edges, etc. state from the Zustand store first:
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode: addNodeToStore,
    setNodes,
    setEdges,
    resetLLMColors,
    setAPIKeys,
    importState,
    selectedNodes,
  } = useStore(selector, shallow);

  // Then declare state variables
  const [isLoading, setIsLoading] = useState(true);
  const [waitingForShare, setWaitingForShare] = useState(false);

  // Add the autosaving hook
  const { autosavingInterval, setAutosavingInterval, initAutosaving } =
    useAutosaving(saveFlow);

  // Add debugging for initial data
  useEffect(() => {
    console.log("App received initialData:", initialData);
    if (initialData) {
      if (initialData.projects) {
        console.log("Setting initial projects:", initialData.projects);
        setProjects(initialData?.projects);
      }
      if (initialData.tasks) {
        console.log("Setting initial tasks:", initialData.tasks);
        setTasks(initialData?.tasks);
      }
    }
  }, [initialData, setProjects, setTasks]);

  // For 'share' button
  const clipboard = useClipboard({ timeout: 1500 });

  // For modal popup to set global settings like API keys
  const settingsModal = useRef<GlobalSettingsModalRef>(null);

  // For modal popup of example flows
  const examplesModal = useRef<ExampleFlowsModalRef>(null);

  // For displaying alerts
  const showAlert = useContext(AlertContext);

  // For confirmation popup
  const confirmationModal = useRef<AreYouSureModalRef>(null);
  const [confirmationDialogProps, setConfirmationDialogProps] = useState<{
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    title: "Confirm action",
    message: "Are you sure?",
  });

  // For Mantine Context Menu forced closing
  // (for some reason the menu doesn't close automatically upon click-off)
  const { hideContextMenu } = useContextMenu();

  // Run once upon ReactFlow initialization
  const onInit = (rf_inst: ReactFlowInstance) => {
    setRfInstance(rf_inst);
    initAutosaving(rf_inst);

    if (APP_IS_RUNNING_LOCALLY) {
      // If we're running locally, try to fetch API keys from Python os.environ variables in the locally running Flask backend:
      fetchEnvironAPIKeys()
        .then((api_keys) => {
          setAPIKeys(api_keys);
        })
        .catch((err) => {
          // Soft fail
          console.warn(
            "Warning: Could not fetch API key environment variables from Flask server. Error:",
            err.message,
          );
        });
    } else {
      // Check if there's a shared flow UID in the URL as a GET param
      // If so, we need to look it up in the database and attempt to load it:
      const shared_flow_uid = getSharedFlowURLParam();
      if (shared_flow_uid !== undefined) {
        try {
          // The format passed a basic smell test;
          // now let's query the server for a flow with that UID:
          fetch("/db/get_sharedflow.php", {
            method: "POST",
            body: shared_flow_uid,
          })
            .then((r) => r.text())
            .then((response) => {
              if (!response || response.startsWith("Error")) {
                // Error encountered during the query; alert the user
                // with the error message:
                throw new Error(response || "Unknown error");
              }

              // Attempt to parse the response as a compressed flow + import it:
              const cforge_json = JSON.parse(
                LZString.decompressFromUTF16(response),
              );
              importFlowFromJSON(cforge_json, rf_inst);
            })
            .catch(handleError);
        } catch (err) {
          // Soft fail
          setIsLoading(false);
          console.error(err);
        }

        // Since we tried to load from the shared flow ID, don't try to load from autosave
        return;
      }
    }

    // Attempt to load an autosaved flow, if one exists:
    //! if (autosavedFlowExists()) loadFlowFromAutosave(rf_inst);
    //! else {
    // Load an interesting default starting flow for new users
    importFlowFromJSON(EXAMPLEFLOW_1, rf_inst);

    // Open a welcome pop-up
    // openWelcomeModal();
    //! }

    // Turn off loading wheel
    setIsLoading(false);
  };

  useEffect(() => {
    return () => {
      if (autosavingInterval) {
        clearInterval(autosavingInterval);
        setAutosavingInterval(undefined);
      }
    };
  }, [autosavingInterval, setAutosavingInterval]);

  // Initialize default flows on app start
  useEffect(() => {
    FlowService.initializeDefaultFlows();
  }, []);

  // Update the importFlowFromJSON function to set the current flow
  const importFlowFromJSON = useCallback(
    (flowData: any, rf_inst: ReactFlowInstance) => {
      try {
        // Create a new flow from the imported data
        const newFlow = FlowService.createFlow(
          "Imported Flow",
          "Imported from JSON",
        );

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

  // Add initialization of default flow on component mount
  useEffect(() => {
    FlowService.initializeDefaultFlows();
    const flows = FlowService.getFlows();
    if (flows.length > 0 && !currentFlow) {
      setCurrentFlow(flows[0]);
      if (flows[0].data) {
        setNodes(flows[0].data.nodes || []);
        setEdges(flows[0].data.edges || []);
        if (flows[0].data.viewport && rfInstance) {
          rfInstance.setViewport(flows[0].data.viewport);
        }
      }
    }
  }, []);

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

  useEffect(() => {
    // Force migration of flow IDs to handle any remaining duplicates
    FlowService.forceMigration();
  }, []);

  // Add ref for group modal
  const groupModal = useRef<GroupModalRef>(null);

  // Add handlers for group/flow creation
  const { addGroupNode } = useNodeCreation(rfInstance);

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
          type: n.type,
          name: n.data?.name || n.type,
        })),
        connections: nodeConnections.map((e) => ({
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
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
        nodes: selectedNodes,
      });
    },
    [selectedNodes, addGroupNode, showAlert],
  );

  // Add keyboard shortcuts
  useHotkeys([
    [
      "g",
      () => {
        if (selectedNodes.length >= 2) {
          groupModal.current?.trigger();
        }
      },
    ],
    [
      "escape",
      () => {
        useStore.getState().setSelectedGroup(null);
        useStore.getState().setSelectedNodes([]);
      },
    ],
  ]);

  // Add handler for opening group modal from selection menu
  const handleSelectionGroupAction = useCallback(() => {
    groupModal.current?.trigger();
  }, []);

  const syncSelectedNodes = useStore((state) => state.syncSelectedNodes);

  useEffect(() => {
    // Sync selected nodes whenever nodes change
    syncSelectedNodes();
  }, [nodes, syncSelectedNodes]);

  return (
    <AlertProvider>
      <div>
        <GlobalSettingsModal ref={settingsModal} />
        <LoadingOverlay visible={isLoading} overlayBlur={1} />
        <ExampleFlowsModal
          ref={examplesModal}
          handleOnSelect={onSelectExampleFlow}
        />
        <AreYouSureModal
          ref={confirmationModal}
          title={confirmationDialogProps.title}
          message={confirmationDialogProps.message}
          onConfirm={confirmationDialogProps.onConfirm}
        />

        {/* <Modal title={'Welcome to ChainForge'} size='400px' opened={welcomeModalOpened} onClose={closeWelcomeModal} yOffset={'6vh'} styles={{header: {backgroundColor: '#FFD700'}, root: {position: 'relative', left: '-80px'}}}>
        <Box m='lg' mt='xl'>
          <Text>To get started, click the Settings icon in the top-right corner.</Text>
        </Box>
      </Modal> */}

        <div
          id="cf-root-container"
          style={{ display: "flex", height: "100vh" }}
          onPointerDown={hideContextMenu}
        >
          <div
            style={{ height: "100%", backgroundColor: "#eee", flexGrow: "1" }}
          >
            <ReactFlow
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodes={nodes}
              edges={edges}
              // @ts-expect-error Node types won't perfectly fit unless we explicitly extend from RF's types; ignoring this for now.
              nodeTypes={nodeTypes}
              // @ts-expect-error Edge types won't perfectly fit unless we explicitly extend from RF's types; ignoring this for now.
              edgeTypes={edgeTypes}
              zoomOnPinch={false}
              zoomOnScroll={false}
              panOnScroll={true}
              disableKeyboardA11y={true}
              deleteKeyCode={[]}
              // connectionLineComponent={AnimatedConnectionLine}
              // connectionLineStyle={connectionLineStyle}
              snapToGrid={true}
              snapGrid={snapGrid}
              onInit={onInit}
              onError={() => {
                // Suppress ReactFlow warnings spamming the console.
                // console.log(err);
              }}
            >
              <Background color="#999" gap={16} />
              <Controls showZoom={true} />
              <SelectionActionMenu onCreateGroup={handleSelectionGroupAction} />
            </ReactFlow>
          </div>
        </div>

        <ControlButtons
          onExport={exportFlow}
          onImport={importFlowFromFile}
          onSettings={onClickSettings}
          currentFlow={currentFlow}
          onCreateFlow={handleCreateFlowFromSelection}
          onLoadFlow={resetFlow}
          onCreateSnapshot={createSnapshot}
          onRestoreSnapshot={restoreSnapshot}
        />

        <div
          style={{
            position: "fixed",
            right: "10px",
            bottom: "20px",
            zIndex: 8,
          }}
        >
          <a
            href="https://forms.gle/AA82Rbn1X8zztcbj8"
            target="_blank"
            style={{ color: "#666", fontSize: "11pt" }}
            rel="noreferrer"
          >
            Send us feedback
          </a>
        </div>
        <GroupModal
          ref={groupModal}
          onCreateGroup={handleCreateGroup}
          onCreateFlow={handleCreateFlowFromSelection}
        />
      </div>
    </AlertProvider>
  );
};
export default App;
