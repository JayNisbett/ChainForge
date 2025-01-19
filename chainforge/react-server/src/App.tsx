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
} from "reactflow";
import { LoadingOverlay } from "@mantine/core";
import { useClipboard, useHotkeys } from "@mantine/hooks";
import { useContextMenu } from "mantine-contextmenu";
import GlobalSettingsModal, {
  GlobalSettingsModalRef,
} from "./components/modals/GlobalSettingsModal";
import ExampleFlowsModal, {
  ExampleFlowsModalRef,
} from "./components/modals/ExampleFlowsModal";
import AreYouSureModal, {
  AreYouSureModalRef,
} from "./components/modals/AreYouSureModal";

import LZString from "lz-string";
import { EXAMPLEFLOW_1 } from "./components/flows/example_flows";
import { GroupModal, GroupModalRef } from "./components/modals/GroupModal";
import { AlertContext, AlertProvider } from "./components/AlertProvider";
import { SelectionActionMenu } from "./components/SelectionActionMenu";
import { FlowData } from "./types/flow";

// Styling
import "reactflow/dist/style.css"; // reactflow
import "./styles/text-fields-node.css"; // project

// Lazy loading images
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";

// State management (from https://reactflow.dev/docs/guides/state-management/)
import { shallow } from "zustand/shallow";
import useStore from "./store/store";
import StorageCache from "./backend/cache";
import { APP_IS_RUNNING_LOCALLY, browserTabIsActive } from "./backend/utils";

import { fetchEnvironAPIKeys, fetchExampleFlow } from "./backend/backend";

import { getSharedFlowURLParam, downloadJSON, selector } from "./utils/app";

import { handleError } from "./utils/errorHandling";
import { FlowService } from "./services/FlowService";
import { nodeTypes, edgeTypes } from "./config/nodeRegistry";

import { useVueUpdates } from "./hooks/useVueUpdates";
import { useFlowManagement } from "./hooks/useFlowManagement";
import { ControlButtons } from "./components/controls/ControlButtons";

import { useAutosaving } from "./hooks/useAutosaving";

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
  const {
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
  } = useFlowManagement();

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

    if (APP_IS_RUNNING_LOCALLY()) {
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
              console.log("cforge_json", cforge_json);
              console.log("rf_inst", rf_inst);
              if (!rf_inst) {
                console.error("rf_inst is undefined");
                return;
              }
              if (!cforge_json) {
                console.error("cforge_json is undefined");
                return;
              }
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

  // Initialize flows on mount
  useEffect(() => {
    // Initialize default flows if needed
    FlowService.initializeDefaultFlows();
  }, []);

  // Add ref for group modal
  const groupModal = useRef<GroupModalRef>(null);

  // Add handlers for group/flow creation
  const { addGroupNode } = useNodeCreation(rfInstance);

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

  /*   const { onClickSettings, createSnapshot, restoreSnapshot } = useFlowActions(
    settingsModal,
    rfInstance,
    currentFlow,
  ); */

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

        <ControlButtons />

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
