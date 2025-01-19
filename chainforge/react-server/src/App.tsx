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
import {
  Button,
  Menu,
  LoadingOverlay,
  Text,
  Box,
  List,
  Loader,
  Tooltip,
} from "@mantine/core";
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
import TextFieldsNode from "./components/nodes/TextFieldsNode"; // Import a custom node
import PromptNode from "./components/nodes/PromptNode";
import CodeEvaluatorNode from "./components/nodes/CodeEvaluatorNode";
import VisNode from "./components/nodes/VisNode";
import InspectNode from "./components/nodes/InspectorNode";
import ScriptNode from "./components/nodes/ScriptNode";
import { AlertModalContext } from "./components/modals/AlertModal";
import ItemsNode from "./components/nodes/ItemsNode";
import TabularDataNode from "./components/nodes/TabularDataNode";
import JoinNode from "./components/nodes/JoinNode";
import SplitNode from "./components/nodes/SplitNode";
import CommentNode from "./components/nodes/CommentNode";
import GlobalSettingsModal, {
  GlobalSettingsModalRef,
} from "./components/modals/GlobalSettingsModal";
import ExampleFlowsModal, {
  ExampleFlowsModalRef,
} from "./components/modals/ExampleFlowsModal";
import AreYouSureModal, {
  AreYouSureModalRef,
} from "./components/modals/AreYouSureModal";
import LLMEvaluatorNode from "./components/nodes/LLMEvalNode";
import SimpleEvalNode from "./components/nodes/SimpleEvalNode";
import {
  getDefaultModelFormData,
  getDefaultModelSettings,
} from "./components/ai/models/ModelSettingSchemas";
import { v4 as uuid } from "uuid";
import LZString from "lz-string";
import { EXAMPLEFLOW_1 } from "./components/flows/example_flows";
import ProjectNode from "./components/nodes/ProjectNode";
import TaskNode from "./components/nodes/TaskNode";
import { FlowManager } from "./components/FlowManager";
import { GroupModal, GroupModalRef } from "./components/modals/GroupModal";
import { AlertContext, AlertProvider } from "./components/AlertProvider";
import { SelectionActionMenu } from "./components/SelectionActionMenu";
import { FlowData, Flow } from "./types/flow";
import GroupNode from "./components/nodes/GroupNode";
import promptData from "./backend/aiPromptNodeData.json";
import { addPromptNodesFromData } from "./utils/nodeGenerator";
import promptCategoriesData from "./backend/aiPromptCategoriesData.json";

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
import MultiEvalNode from "./components/nodes/MultiEvalNode";
import { FlowService } from "./services/FlowService";
import DynamicPromptNode from "./components/nodes/DynamicPromptNode";

const IS_ACCEPTED_BROWSER =
  (isChrome ||
    isChromium ||
    isEdgeChromium ||
    isFirefox ||
    (navigator as any)?.brave !== undefined) &&
  !isMobile;

// Whether we are running on localhost or not, and hence whether
// we have access to the Flask backend for, e.g., Python code evaluation.
const IS_RUNNING_LOCALLY = APP_IS_RUNNING_LOCALLY();

const selector = (state: StoreHandles) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  addNode: state.addNode,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  resetLLMColors: state.resetLLMColors,
  setAPIKeys: state.setAPIKeys,
  importState: state.importState,
  selectedNodes: state.selectedNodes,
});

// The initial LLM to use when new flows are created, or upon first load
const INITIAL_LLM = () => {
  if (!IS_RUNNING_LOCALLY) {
    // Prefer HF if running on server, as it's free.
    const falcon7b = {
      key: uuid(),
      name: "Mistral-7B",
      emoji: "🤗",
      model: "mistralai/Mistral-7B-Instruct-v0.1",
      base_model: "hf",
      temp: 1.0,
      settings: getDefaultModelSettings("hf"),
      formData: getDefaultModelFormData("hf"),
    } satisfies LLMSpec;
    falcon7b.formData.shortname = falcon7b.name;
    falcon7b.formData.model = falcon7b.model;
    return falcon7b;
  } else {
    // Prefer OpenAI for majority of local users.
    const chatgpt = {
      key: uuid(),
      name: "GPT3.5",
      emoji: "🤖",
      model: "gpt-3.5-turbo",
      base_model: "gpt-3.5-turbo",
      temp: 1.0,
      settings: getDefaultModelSettings("gpt-3.5-turbo"),
      formData: getDefaultModelFormData("gpt-3.5-turbo"),
    } satisfies LLMSpec;
    chatgpt.formData.shortname = chatgpt.name;
    chatgpt.formData.model = chatgpt.model;
    return chatgpt;
  }
};

const nodeTypes = {
  textfields: TextFieldsNode, // Register the custom node
  prompt: PromptNode,
  chat: PromptNode,
  simpleval: SimpleEvalNode,
  evaluator: CodeEvaluatorNode,
  llmeval: LLMEvaluatorNode,
  multieval: MultiEvalNode,
  vis: VisNode,
  inspect: InspectNode,
  script: ScriptNode,
  csv: ItemsNode,
  table: TabularDataNode,
  comment: CommentNode,
  join: JoinNode,
  split: SplitNode,
  processor: CodeEvaluatorNode,
  project: ProjectNode,
  task: TaskNode,
  groupNode: GroupNode,
  dynamicprompt: DynamicPromptNode,
};

const edgeTypes = {
  default: RemoveEdge,
};

// Try to get a GET param in the URL, representing the shared flow.
// Returns undefined if not found.
const getSharedFlowURLParam = () => {
  // Get the current URL
  const curr_url = new URL(window.location.href);

  // Get the search parameters from the URL
  const params = new URLSearchParams(curr_url.search);

  // Try to retrieve an 'f' parameter (short for flow)
  const shared_flow_uid = params.get("f");

  if (shared_flow_uid) {
    // Check if it's a base36 string:
    const is_base36 = /^[0-9a-z]+$/i;
    if (shared_flow_uid.length > 1 && is_base36.test(shared_flow_uid))
      return shared_flow_uid;
  }
  return undefined;
};

const MenuTooltip = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  return (
    <Tooltip
      label={label}
      position="right"
      width={200}
      multiline
      withArrow
      arrowSize={10}
    >
      {children}
    </Tooltip>
  );
};

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

// Add PromptData interface
interface PromptData {
  _id: string;
  title: string;
  categoryRef: number;
  fields: {
    key: string;
    defaultValue?: string;
    value?: string;
    placeHolder?: string;
  }[];
  outputFormat?: string;
  displayButton?: { name: string; value: string }[];
  stream?: boolean;
}

// Add this helper function to organize prompts by category
const organizePromptsByCategory = (
  prompts: any[],
  categories: { key: number; categoryName: string }[],
) => {
  const categoryMap = new Map();

  // Initialize categories
  categories.forEach((category) => {
    categoryMap.set(category.key, {
      ...category,
      prompts: [],
    });
  });

  // Sort prompts into categories
  prompts.forEach((prompt) => {
    const category = categoryMap.get(prompt.categoryRef);
    if (category) {
      category.prompts.push(prompt);
    }
  });

  return Array.from(categoryMap.values());
};

const App = ({ initialData }: { initialData?: MountProps["initialData"] }) => {
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
  const [currentFlow, setCurrentFlow] = useState<Flow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [waitingForShare, setWaitingForShare] = useState(false);
  const [autosavingInterval, setAutosavingInterval] = useState<
    NodeJS.Timeout | undefined
  >(undefined);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  // Now we can define resetFlow since setNodes and setEdges are available
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

  // Add event listener for updates from Vue
  useEffect(() => {
    const handleVueUpdate = (event: VueUpdateEvent) => {
      const { type, data } = event.detail;
      console.log("Received update from Vue:", { type, data });

      switch (type) {
        case "projects":
          setProjects(data);
          break;
        case "tasks":
          setTasks(data);
          break;
        default:
          console.warn("Unknown update type from Vue:", type);
      }
    };

    window.addEventListener("vueUpdate", handleVueUpdate as EventListener);
    return () => {
      window.removeEventListener("vueUpdate", handleVueUpdate as EventListener);
    };
  }, [setProjects, setTasks]);

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

  // Helper
  const getWindowSize = () => ({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const getWindowCenter = () => {
    const { width, height } = getWindowSize();
    return { centerX: width / 2.0, centerY: height / 2.0 };
  };
  const getViewportCenter = () => {
    const { centerX, centerY } = getWindowCenter();
    if (rfInstance === null) return { x: centerX, y: centerY };
    // Support Zoom
    const { x, y, zoom } = rfInstance.getViewport();
    return { x: -(x / zoom) + centerX / zoom, y: -(y / zoom) + centerY / zoom };
  };

  const addNode = (
    id: string,
    type?: string,
    data?: Dict,
    offsetX?: number,
    offsetY?: number,
  ) => {
    const { x, y } = getViewportCenter();
    addNodeToStore({
      id: `${id}-` + Date.now(),
      type: type ?? id,
      data: data ?? {},
      position: {
        x: x - 200 + (offsetX || 0),
        y: y - 100 + (offsetY || 0),
      },
    });
  };

  const addTextFieldsNode = () => addNode("textFieldsNode", "textfields");
  const addProjectNode = () =>
    addNode("projectNode", "project", { projects: projects, tasks: tasks });
  const addTaskNode = () => addNode("taskNode", "task", { tasks: tasks });
  const addPromptNode = () => addNode("promptNode", "prompt", { prompt: "" });
  const addChatTurnNode = () => addNode("chatTurn", "chat", { prompt: "" });
  const addSimpleEvalNode = () => addNode("simpleEval", "simpleval");
  const addEvalNode = (progLang: string) => {
    let code = "";
    if (progLang === "python") {
      code = "def evaluate(response):\n  return len(response.text)";
    } else if (progLang === "javascript") {
      code = "function evaluate(response) {\n  return response.text.length;\n}";
    }
    addNode("evalNode", "evaluator", { language: progLang, code });
  };
  const addVisNode = () => addNode("visNode", "vis", {});
  const addInspectNode = () => addNode("inspectNode", "inspect");
  const addScriptNode = () => addNode("scriptNode", "script");
  const addItemsNode = () => addNode("csvNode", "csv");
  const addTabularDataNode = () => addNode("table");
  const addCommentNode = () => addNode("comment");
  const addLLMEvalNode = () => addNode("llmeval");
  const addMultiEvalNode = () => addNode("multieval");
  const addJoinNode = () => addNode("join");
  const addSplitNode = () => addNode("split");
  const addProcessorNode = (progLang: string) => {
    let code = "";
    if (progLang === "python")
      code = "def process(response):\n  return response.text;";
    else if (progLang === "javascript")
      code = "function process(response) {\n  return response.text;\n}";
    addNode("process", "processor", { language: progLang, code });
  };

  const onClickExamples = () => {
    if (examplesModal && examplesModal.current) examplesModal.current.trigger();
  };
  const onClickSettings = () => {
    if (settingsModal && settingsModal.current) settingsModal.current.trigger();
  };

  const handleError = (err: unknown) => {
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : "An unknown error occurred";
    setIsLoading(false);
    setWaitingForShare(false);
    if (showAlert) showAlert(msg);
    console.error(msg);
  };

  /**
   * SAVING / LOADING, IMPORT / EXPORT (from JSON)
   */
  const downloadJSON = (jsonData: any, filename: string) => {
    // Convert JSON object to JSON string
    const jsonString = JSON.stringify(jsonData, null, 2);

    // Create a Blob object from the JSON string
    const blob = new Blob([jsonString], { type: "application/json" });

    // Create a temporary download link
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = filename;

    // Add the link to the DOM (it's not visible)
    document.body.appendChild(downloadLink);

    // Trigger the download by programmatically clicking the temporary link
    downloadLink.click();

    // Remove the temporary link from the DOM and revoke the URL
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadLink.href);
  };

  // Save the current flow to localStorage for later recall. Useful to getting
  // back progress upon leaving the site / browser crash / system restart.
  const saveFlow = useCallback(
    (rf_inst: ReactFlowInstance) => {
      const rf = rf_inst ?? rfInstance;
      if (!rf || !currentFlow) return;

      // Get ReactFlow data
      const rfData = rf.toObject();

      // Convert to our Flow data structure
      const flowData: FlowData = {
        nodes: rfData.nodes,
        edges: rfData.edges,
        viewport: rfData.viewport,
        groups: currentFlow.data.groups || [],
      };

      // Save to FlowService
      FlowService.updateFlow(currentFlow.id, {
        ...currentFlow,
        data: flowData,
        cache: StorageCache.getAllMatching((key) => key.startsWith("r.")),
      });

      // Also save to localStorage as backup
      StorageCache.saveToLocalStorage("chainforge-flow", flowData);
      StorageCache.saveToLocalStorage("chainforge-state");

      console.log("Flow saved!");
    },
    [rfInstance, currentFlow],
  );

  // Create new flow
  const createNewFlow = useCallback(
    async (name: string, description?: string) => {
      const newFlow = FlowService.createFlow(name, description);
      setCurrentFlow(newFlow);
      resetFlow(); // Your existing reset flow logic
    },
    [resetFlow],
  );

  // Load flow
  const loadFlow = useCallback(
    (flowId: string) => {
      const flows = FlowService.getFlows();
      const flow = flows.find((f) => f.id === flowId);
      if (!flow) return;

      setCurrentFlow(flow);
      if (flow.data) {
        setNodes(flow.data.nodes);
        setEdges(flow.data.edges);
        if (flow.data.viewport && rfInstance) {
          rfInstance.setViewport(flow.data.viewport);
        }
      }

      // Load cache if exists
      if (flow.cache) {
        StorageCache.store("cache", flow.cache);
      }
    },
    [setNodes, setEdges, rfInstance],
  );

  // Create snapshot
  const createSnapshot = useCallback(
    (name?: string, description?: string) => {
      if (!currentFlow) {
        console.error("No current flow to snapshot");
        return;
      }

      // Get current flow state
      if (!rfInstance) {
        console.error("No ReactFlow instance available");
        return;
      }

      // Update the current flow before creating snapshot
      const flowData = rfInstance.toObject();
      const updatedFlow = FlowService.updateFlow(currentFlow.id, {
        data: flowData,
        cache: StorageCache.getAllMatching((key) => key.startsWith("r.")),
      });

      // Create snapshot from updated flow
      try {
        const snapshot = FlowService.createSnapshot(
          updatedFlow.id,
          name || `Snapshot ${new Date().toLocaleString()}`,
          description,
        );
        console.log("Created snapshot:", snapshot);
        if (showAlert) showAlert("Snapshot created successfully");
      } catch (err) {
        console.error("Failed to create snapshot:", err);
        if (showAlert) showAlert("Failed to create snapshot");
      }
    },
    [currentFlow, rfInstance, showAlert],
  );

  // Restore snapshot
  const restoreSnapshot = useCallback(
    (snapshotId: string) => {
      try {
        console.log("Restoring snapshot:", snapshotId);
        const updatedFlow = FlowService.restoreSnapshot(snapshotId);
        console.log("Flow restored:", updatedFlow);

        setCurrentFlow(updatedFlow);

        // Apply the restored flow data
        if (updatedFlow.data) {
          setNodes(updatedFlow.data.nodes || []);
          setEdges(updatedFlow.data.edges || []);
          if (updatedFlow.data.viewport && rfInstance) {
            rfInstance.setViewport(updatedFlow.data.viewport);
          }
        }

        // Restore cache if exists
        if (updatedFlow.cache) {
          StorageCache.clear(); // Clear existing cache
          Object.entries(updatedFlow.cache).forEach(([key, value]) => {
            StorageCache.store(key, value);
          });
        }

        if (showAlert) showAlert("Snapshot restored successfully");
      } catch (err) {
        console.error("Failed to restore snapshot:", err);
        if (showAlert) showAlert("Failed to restore snapshot");
      }
    },
    [rfInstance, setNodes, setEdges, showAlert],
  );

  // Triggered when user confirms 'New Flow' button
  const onClickNewFlow = useCallback(() => {
    setConfirmationDialogProps({
      title: "Create a new flow",
      message:
        "Are you sure? Any unexported changes to your existing flow will be lost.",
      onConfirm: () => resetFlow(), // Set the callback if user confirms action
    });

    // Trigger the 'are you sure' modal:
    if (confirmationModal && confirmationModal.current)
      confirmationModal.current?.trigger();
  }, [confirmationModal, resetFlow, setConfirmationDialogProps]);

  // When the user clicks the 'Share Flow' button
  const onClickShareFlow = useCallback(async () => {
    if (IS_RUNNING_LOCALLY) {
      handleError(
        new Error(
          "Cannot upload flow to server database when running locally: Feature only exists on hosted version of ChainForge.",
        ),
      );
      return;
    } else if (waitingForShare === true) {
      handleError(
        new Error(
          "A share request is already in progress. Wait until the current share finishes before clicking again.",
        ),
      );
      return;
    }

    // Helper function
    function isFileSizeLessThan5MB(json_str: string) {
      const encoder = new TextEncoder();
      const encodedString = encoder.encode(json_str);
      const fileSizeInBytes = encodedString.length;
      const fileSizeInMB = fileSizeInBytes / (1024 * 1024); // Convert bytes to megabytes
      return fileSizeInMB < 5;
    }

    setWaitingForShare(true);

    // Package up the current flow:
    const flow = rfInstance?.toObject();
    const all_node_ids = nodes.map((n) => n.id);
    const cforge_data = await exportCache(all_node_ids)
      .then(function (cacheData) {
        // Now we append the cache file data to the flow
        return {
          flow,
          cache: cacheData,
        };
      })
      .catch(handleError);

    if (!cforge_data) return;

    // Compress the data and check it's compressed size < 5MB:
    const compressed = LZString.compressToUTF16(JSON.stringify(cforge_data));
    if (!isFileSizeLessThan5MB(compressed)) {
      handleError(
        new Error(
          "Flow filesize exceeds 5MB. You can only share flows up to 5MB or less. But, don't despair! You can still use 'Export Flow' to share your flow manually as a .cforge file.",
        ),
      );
      return;
    }

    // Try to upload the compressed cforge data to the server:
    fetch("/db/shareflow.php", {
      method: "POST",
      body: compressed,
    })
      .then((r) => r.text())
      .then((uid) => {
        if (!uid) {
          throw new Error("Received no response from server.");
        } else if (uid.startsWith("Error")) {
          // Error encountered during the query; alert the user
          // with the error message:
          throw new Error(uid);
        }

        // Share completed!
        setWaitingForShare(false);

        // The response should be a uid we can put in a GET request.
        // Generate the link:
        const base_url = new URL(
          window.location.origin + window.location.pathname,
        ); // the current address e.g., https://chainforge.ai/play
        const get_params = new URLSearchParams(base_url.search);
        // Add the 'f' parameter
        get_params.set("f", uid); // set f=uid
        // Update the URL with the modified search parameters
        base_url.search = get_params.toString();
        // Get the modified URL
        const get_url = base_url.toString();

        // Copies the GET URL to user's clipboard
        // and updates the 'Share This' button state:
        clipboard.copy(get_url);
      })
      .catch((err) => {
        handleError(err);
      });
  }, [
    rfInstance,
    nodes,
    IS_RUNNING_LOCALLY,
    handleError,
    clipboard,
    waitingForShare,
  ]);

  // Initialize auto-saving
  const initAutosaving = useCallback(
    (rf_inst: ReactFlowInstance) => {
      if (autosavingInterval !== undefined) return; // autosaving interval already set
      console.log("Init autosaving");

      // Autosave the flow every minute:
      const interv = setInterval(() => {
        // Check the visibility of the browser tab
        if (!browserTabIsActive()) return;

        // Start a timer, in case the saving takes a long time
        const startTime = Date.now();

        // Save the flow
        saveFlow(rf_inst);

        // Check how long the save took
        const duration = Date.now() - startTime;
        if (duration > 1500) {
          // If the operation took longer than 1.5 seconds, disable autosaving
          console.warn(
            "Autosaving disabled. The time required to save exceeds 1.5 seconds.",
          );
          clearInterval(interv);
          setAutosavingInterval(undefined);
        }
      }, 60000); // 60000 milliseconds = 1 minute

      setAutosavingInterval(interv);
    },
    [saveFlow, autosavingInterval],
  );

  // Run once upon ReactFlow initialization
  const onInit = (rf_inst: ReactFlowInstance) => {
    setRfInstance(rf_inst);
    initAutosaving(rf_inst);

    if (IS_RUNNING_LOCALLY) {
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
    // Cleanup the autosaving interval upon component unmount:
    return () => {
      clearInterval(autosavingInterval); // Clear the interval when the component is unmounted
    };
  }, []);

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
      addNode(`groupnode-${groupId}`, "groupNode", {
        id: `groupnode-${groupId}`,
        type: "groupNode",
        position: { x: centerX, y: centerY },
        data: {
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
        },
        selected: false,
      } as Node);
    },
    [selectedNodes, nodes, edges, addNode, setNodes, setEdges, showAlert],
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
      addNode("groupNode", "group", {
        name,
        description,
        referencedFlowId: newFlowId,
        isCollapsed: false,
      });
    },
    [selectedNodes, addNode, showAlert],
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

  // Add this with the other node addition functions
  const addDynamicPromptNode = (promptData: any) => {
    addNode("dynamicPromptNode", "dynamicprompt", {
      _id: promptData._id,
      title: promptData.title || "Dynamic Prompt",
      categoryRef: promptData.categoryRef,
      fields: promptData.fields.map((field: any) => ({
        ...field,
        value: field.defaultValue || field.value || "",
      })),
      outputFormat: promptData.outputFormat,
      displayButton: promptData.displayButton,
      stream: promptData.stream,
    });
  };

  // Add a function to load all prompts
  /* const loadPromptNodes = () => {
    if (promptData.status && Array.isArray(promptData.statusText)) {
      addPromptNodesFromData(promptData.statusText, addNode);
    }
  }; */

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

        <div
          id="custom-controls"
          style={{ position: "fixed", left: "10px", top: "10px", zIndex: 8 }}
        >
          <FlowManager
            currentFlow={currentFlow}
            onCreateFlow={createNewFlow}
            onLoadFlow={loadFlow}
            onCreateSnapshot={createSnapshot}
            onRestoreSnapshot={restoreSnapshot}
          />
          <Menu
            transitionProps={{ transition: "pop-top-left" }}
            position="top-start"
            width={220}
            closeOnClickOutside={true}
            closeOnEscape
            styles={{ item: { maxHeight: "28px" } }}
          >
            <Menu.Target>
              <Button size="sm" variant="gradient" compact mr="sm">
                Add Node +
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Project Data</Menu.Label>
              <MenuTooltip label="Select a project to use as input for your flow.">
                <Menu.Item
                  onClick={addProjectNode}
                  icon={<IconTextPlus size="16px" />}
                >
                  {" "}
                  Project Node{" "}
                </Menu.Item>
              </MenuTooltip>
              <MenuTooltip label="Select a task to use as input for your flow.">
                <Menu.Item
                  onClick={addTaskNode}
                  icon={<IconTextPlus size="16px" />}
                >
                  {" "}
                  Task Node{" "}
                </Menu.Item>
              </MenuTooltip>
              <Menu.Label>Input Data</Menu.Label>
              <MenuTooltip label="Specify input text to prompt or chat nodes. You can also declare variables in brackets {} to chain TextFields together.">
                <Menu.Item
                  onClick={addTextFieldsNode}
                  icon={<IconTextPlus size="16px" />}
                >
                  {" "}
                  TextFields Node{" "}
                </Menu.Item>
              </MenuTooltip>
              <MenuTooltip label="Specify inputs as a comma-separated list of items. Good for specifying lots of short text values. An alternative to TextFields node.">
                <Menu.Item
                  onClick={addItemsNode}
                  icon={<IconForms size="16px" />}
                >
                  {" "}
                  Items Node{" "}
                </Menu.Item>
              </MenuTooltip>
              <MenuTooltip label="Import or create a spreadhseet of data to use as input to prompt or chat nodes. Import accepts xlsx, csv, and jsonl.">
                <Menu.Item onClick={addTabularDataNode} icon={"🗂️"}>
                  {" "}
                  Tabular Data Node{" "}
                </Menu.Item>
              </MenuTooltip>
              <Menu.Divider />
              <Menu.Label>Prompters</Menu.Label>
              <MenuTooltip label="Prompt one or multiple LLMs. Specify prompt variables in brackets {}.">
                <Menu.Item onClick={addPromptNode} icon={"💬"}>
                  {" "}
                  Prompt Node{" "}
                </Menu.Item>
              </MenuTooltip>
              <MenuTooltip label="Start or continue a conversation with chat models. Attach Prompt Node output as past context to continue chatting past the first turn.">
                <Menu.Item onClick={addChatTurnNode} icon={"🗣"}>
                  {" "}
                  Chat Turn Node{" "}
                </Menu.Item>
              </MenuTooltip>
              <Menu.Divider />
              <Menu.Label>Evaluators</Menu.Label>
              <MenuTooltip label="Evaluate responses with a simple check (no coding required).">
                <Menu.Item
                  onClick={addSimpleEvalNode}
                  icon={<IconRuler2 size="16px" />}
                >
                  {" "}
                  Simple Evaluator{" "}
                </Menu.Item>
              </MenuTooltip>
              <MenuTooltip label="Evaluate responses by writing JavaScript code.">
                <Menu.Item
                  onClick={() => addEvalNode("javascript")}
                  icon={<IconTerminal size="16px" />}
                >
                  {" "}
                  JavaScript Evaluator{" "}
                </Menu.Item>
              </MenuTooltip>
              <MenuTooltip label="Evaluate responses by writing Python code.">
                <Menu.Item
                  onClick={() => addEvalNode("python")}
                  icon={<IconTerminal size="16px" />}
                >
                  {" "}
                  Python Evaluator{" "}
                </Menu.Item>
              </MenuTooltip>
              <MenuTooltip label="Evaluate responses with an LLM like GPT-4.">
                <Menu.Item
                  onClick={addLLMEvalNode}
                  icon={<IconRobot size="16px" />}
                >
                  {" "}
                  LLM Scorer{" "}
                </Menu.Item>
              </MenuTooltip>
              <MenuTooltip label="Evaluate responses across multiple criteria (multiple code and/or LLM evaluators).">
                <Menu.Item
                  onClick={addMultiEvalNode}
                  icon={<IconAbacus size="16px" />}
                >
                  {" "}
                  Multi-Evaluator{" "}
                </Menu.Item>
              </MenuTooltip>
              <Menu.Divider />
              <Menu.Label>Visualizers</Menu.Label>
              <MenuTooltip label="Plot evaluation results. (Attach an evaluator or scorer node as input.)">
                <Menu.Item onClick={addVisNode} icon={"📊"}>
                  {" "}
                  Vis Node{" "}
                </Menu.Item>
              </MenuTooltip>
              <MenuTooltip label="Used to inspect responses from prompter or evaluation nodes, without opening up the pop-up view.">
                <Menu.Item onClick={addInspectNode} icon={"🔍"}>
                  {" "}
                  Inspect Node{" "}
                </Menu.Item>
              </MenuTooltip>
              <Menu.Divider />
              <Menu.Label>Processors</Menu.Label>
              <MenuTooltip label="Transform responses by mapping a JavaScript function over them.">
                <Menu.Item
                  onClick={() => addProcessorNode("javascript")}
                  icon={<IconTerminal size="14pt" />}
                >
                  {" "}
                  JavaScript Processor{" "}
                </Menu.Item>
              </MenuTooltip>
              {IS_RUNNING_LOCALLY ? (
                <MenuTooltip label="Transform responses by mapping a Python function over them.">
                  <Menu.Item
                    onClick={() => addProcessorNode("python")}
                    icon={<IconTerminal size="14pt" />}
                  >
                    {" "}
                    Python Processor{" "}
                  </Menu.Item>
                </MenuTooltip>
              ) : (
                <></>
              )}
              <MenuTooltip label="Concatenate responses or input data together before passing into later nodes, within or across variables and LLMs.">
                <Menu.Item
                  onClick={addJoinNode}
                  icon={<IconArrowMerge size="14pt" />}
                >
                  {" "}
                  Join Node{" "}
                </Menu.Item>
              </MenuTooltip>
              <MenuTooltip label="Split responses or input data by some format. For instance, you can split a markdown list into separate items.">
                <Menu.Item
                  onClick={addSplitNode}
                  icon={<IconArrowsSplit size="14pt" />}
                >
                  {" "}
                  Split Node{" "}
                </Menu.Item>
              </MenuTooltip>
              <Menu.Divider />
              <Menu.Label>Misc</Menu.Label>
              <MenuTooltip label="Make a comment about your flow.">
                <Menu.Item onClick={addCommentNode} icon={"✏️"}>
                  {" "}
                  Comment Node{" "}
                </Menu.Item>
              </MenuTooltip>
              {IS_RUNNING_LOCALLY ? (
                <MenuTooltip label="Specify directories to load as local packages, so they can be imported in your Python evaluator nodes (add to sys path).">
                  <Menu.Item
                    onClick={addScriptNode}
                    icon={<IconSettingsAutomation size="16px" />}
                  >
                    {" "}
                    Global Python Scripts{" "}
                  </Menu.Item>
                </MenuTooltip>
              ) : (
                <></>
              )}
              <Menu.Label>Groups</Menu.Label>
              <Menu.Item
                icon={<IconLayersSubtract size={14} />}
                onClick={() => {
                  if (!showAlert) return;
                  if (selectedNodes.length < 2) {
                    showAlert("Select at least 2 nodes to create a group");
                    return;
                  }
                  groupModal.current?.trigger();
                }}
              >
                Create Group/Flow from Selection
              </Menu.Item>
              <Menu.Divider />
              <Menu.Label>Dynamic Prompts</Menu.Label>
              {promptData.status && promptCategoriesData.status ? (
                organizePromptsByCategory(
                  promptData.statusText,
                  promptCategoriesData.statusText,
                ).map((category) => (
                  <Menu key={category.key}>
                    <Menu.Target>
                      <Text
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          padding: "8px",
                          fontSize: "14px",
                          "&:hover": {
                            backgroundColor: "#f8f9fa",
                          },
                        }}
                      >
                        <IconForms size="14pt" style={{ marginRight: "8px" }} />
                        {category.categoryName}
                      </Text>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {category.prompts.map((prompt: PromptData) => (
                        <MenuTooltip
                          key={prompt._id}
                          label={`${prompt.title}: ${
                            prompt.fields[0]?.placeHolder ||
                            "Create a new prompt"
                          }`}
                        >
                          <Menu.Item
                            onClick={() => {
                              addDynamicPromptNode(prompt);
                            }}
                          >
                            {prompt.title}
                          </Menu.Item>
                        </MenuTooltip>
                      ))}
                      {category.prompts.length === 0 && (
                        <Menu.Item disabled>
                          No prompts in this category
                        </Menu.Item>
                      )}
                    </Menu.Dropdown>
                  </Menu>
                ))
              ) : (
                <Menu.Item disabled>No dynamic prompts available</Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
          <Button
            onClick={exportFlow}
            size="sm"
            variant="outline"
            bg="#eee"
            compact
            mr="xs"
          >
            Export
          </Button>
          <Button
            onClick={importFlowFromFile}
            size="sm"
            variant="outline"
            bg="#eee"
            compact
          >
            Import
          </Button>
        </div>
        <div
          style={{ position: "fixed", right: "10px", top: "10px", zIndex: 8 }}
        >
          {IS_RUNNING_LOCALLY ? (
            <></>
          ) : (
            <Button
              onClick={onClickShareFlow}
              size="sm"
              variant="outline"
              compact
              color={clipboard.copied ? "teal" : "blue"}
              mr="xs"
              style={{ float: "left" }}
            >
              {waitingForShare ? (
                <Loader size="xs" mr="4px" />
              ) : (
                <IconFileSymlink size="16px" />
              )}
              {clipboard.copied
                ? "Link copied!"
                : waitingForShare
                  ? "Sharing..."
                  : "Share"}
            </Button>
          )}
          <Button
            onClick={onClickNewFlow}
            size="sm"
            variant="outline"
            bg="#eee"
            compact
            mr="xs"
            style={{ float: "left" }}
          >
            {" "}
            New Flow{" "}
          </Button>
          <Button
            onClick={onClickExamples}
            size="sm"
            variant="filled"
            compact
            mr="xs"
            style={{ float: "left" }}
          >
            {" "}
            Example Flows{" "}
          </Button>
          <Button
            onClick={onClickSettings}
            size="sm"
            variant="gradient"
            compact
          >
            <IconSettings size={"90%"} />
          </Button>
        </div>
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
