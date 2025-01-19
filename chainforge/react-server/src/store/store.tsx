import { create } from "zustand";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  MarkerType,
  Connection,
  ReactFlowInstance,
  Viewport,
} from "reactflow";
import { escapeBraces } from "../backend/template";
import {
  deepcopy,
  transformDict,
  APP_IS_RUNNING_LOCALLY,
} from "../backend/utils";
import { DuplicateVariableNameError } from "../backend/errors";
import {
  Dict,
  LLMGroup,
  LLMSpec,
  PromptVarType,
  PromptVarsDict,
  TemplateVarInfo,
  TabularDataColType,
  TabularDataRowType,
} from "../backend/typing";
import { TogetherChatSettings } from "../components/ai/models/ModelSettingSchemas";
import {
  llmColorPalette,
  varColorPalette,
  refreshableOutputNodeTypes,
  initLLMProviderMenu,
} from "../config";
import { Flow, Group, FlowData } from "../types/flow";
import { v4 as uuid } from "uuid";
import { FlowService } from "../services/FlowService";

// Initial project settings
const initialAPIKeys = {};
const initialFlags = { aiSupport: true };
const initialLLMColors = {};

const togetherModels = TogetherChatSettings.schema.properties.model
  .enum as string[];
const togetherGroups = () => {
  const groupNames: string[] = [];
  const groups: { [key: string]: LLMGroup } = {};
  togetherModels.forEach((model) => {
    const [groupName, modelName] = model.split("/");
    const spec: LLMSpec = {
      id: uuid(),
      name: modelName,
      emoji: "🤝",
      model: "together/" + model,
      base_model: "together",
      temp: 0.9,
    };
    if (groupName in groups) {
      (groups[groupName].items as LLMSpec[]).push(spec);
    } else {
      groups[groupName] = {
        group: groupName,
        emoji: "🤝",
        items: [spec],
      };
      groupNames.push(groupName);
    }
  });
  return groupNames.map((name) => groups[name]);
};
console.log(togetherGroups());
const togetherLLMProviderMenu: LLMGroup = {
  group: "Together",
  emoji: "🤝",
  items: togetherGroups(),
};
initLLMProviderMenu.push(togetherLLMProviderMenu);

if (APP_IS_RUNNING_LOCALLY()) {
  initLLMProviderMenu.push({
    id: uuid(),
    name: "Ollama",
    emoji: "🦙",
    model: "ollama",
    base_model: "ollama",
    temp: 1.0,
  });
  // -- Deprecated provider --
  // initLLMProviders.push({ name: "Dalai (Alpaca.7B)", emoji: "🦙", model: "alpaca.7B", base_model: "dalai", temp: 0.5 });
  // -------------------------
}

function flattenLLMGroup(group: LLMGroup): LLMSpec[] {
  return group.items.flatMap((item) =>
    "group" in item && "items" in item ? flattenLLMGroup(item) : item,
  );
}

function flattenLLMProviders(providers: (LLMSpec | LLMGroup)[]): LLMSpec[] {
  return providers.flatMap((item) =>
    "group" in item && "items" in item ? flattenLLMGroup(item) : item,
  );
}

export const initLLMProviders = flattenLLMProviders(initLLMProviderMenu);

export interface Project {
  _id: string;
  name: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface StoreHandles {
  // Nodes and edges
  nodes: Node[];
  edges: Edge[];

  // Helper functions for nodes and edges
  getNode: (id: string) => Node | undefined;
  addNode: (node: Node | string, type?: string, data?: Dict<any>) => void;
  removeNode: (id: string) => void;
  deselectAllNodes: () => void;
  bringNodeToFront: (id: string) => void;
  duplicateNode: (id: string, offset?: { x?: number; y?: number }) => Node;
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  removeEdge: (id: string) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection | Edge) => void;

  // The LLM providers available in the drop-down list
  AvailableLLMs: LLMSpec[];
  setAvailableLLMs: (specs: LLMSpec[]) => void;

  // API keys to LLM providers
  apiKeys: Dict<string>;
  setAPIKeys: (apiKeys: Dict<string>) => void;

  // Provider for genAI features
  aiFeaturesProvider: string;
  setAIFeaturesProvider: (llmProvider: string) => void;

  // Global flags
  flags: Dict<boolean | string>;
  getFlag: (flag: string) => boolean | string;
  setFlag: (flag: string, val: boolean | string) => void;

  // Global state
  state: Dict;
  setState: (key: string, val: any) => void;
  importState: (state: Dict) => void;

  // The color to represent a specific LLM, to be globally consistent
  llmColors: Dict<string>;
  getColorForLLM: (llm_name: string) => string | undefined;
  getColorForLLMAndSetIfNotFound: (llm_name: string) => string;
  genUniqueLLMColor: () => string;
  setColorForLLM: (llm_name: string, color: string) => void;
  resetLLMColors: () => void;

  // Getting inputs and outputs of nodes
  inputEdgesForNode: (sourceNodeId: string) => Edge[];
  outputEdgesForNode: (sourceNodeId: string) => Edge[];
  pingOutputNodes: (sourceNodeId: string) => void;
  getImmediateInputNodeTypes: (
    targetHandles: string[],
    node_id: string,
  ) => string[];

  // Set data for a specific node
  setDataPropsForNode: (
    id: string,
    data_props: Dict<string | boolean | number | null | Dict>,
  ) => void;

  // Rasterize data output from nodes ("pull" the data out)
  output: (
    sourceNodeId: string,
    sourceHandleKey: string,
  ) => (string | TemplateVarInfo)[] | null;
  pullInputData: (
    _targetHandles: string[],
    node_id: string,
  ) => Dict<string[] | TemplateVarInfo[]>;

  // Add project-related state and methods
  projects: Project[];
  tasks: any[];
  selectedProject: Project | null;
  company: any;

  // Project related methods
  setProjects: (projects: Project[]) => void;
  setTasks: (tasks: any[]) => void;
  setSelectedProject: (project: Project | null) => void;
  setCompany: (company: any) => void;

  // Add group-related properties
  groups: Group[];
  selectedNodes: string[];

  // Add group-related methods
  createGroup: (name: string, description?: string) => string;
  addNodesToGroup: (groupId: string, nodeIds: string[]) => void;
  removeNodesFromGroup: (groupId: string, nodeIds: string[]) => void;
  deleteGroup: (groupId: string) => void;
  setSelectedNodes: (nodeIds: string[]) => void;
  createFlowFromSelection: (name: string, description?: string) => string;

  selectedGroup: string | null;
  setSelectedGroup: (groupId: string | null) => void;
  selectNodesInGroup: (groupId: string) => void;

  // Add a helper method to check selection
  getSelectedNodes: () => string[];

  // Add method to sync selection state
  syncSelectedNodes: () => void;

  ungroup: (groupNodeId: string) => void;

  // ReactFlowInstance
  rfInstance: ReactFlowInstance | null;
  setRfInstance: (instance: ReactFlowInstance | null) => void;

  // Viewport
  viewport: Viewport;
  setViewport: (viewport: Viewport) => void;

  // Groups
  setGroups: (groups: Group[]) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;

  // Cache
  cache: Dict<any>;
  restoreCache: (cache: Dict<any>) => void;
}

// A global store of variables, used for maintaining state
// across ChainForge and ReactFlow components.
export const useStore = create<StoreHandles>((set, get) => ({
  nodes: [],
  edges: [],

  // Available LLMs in ChainForge, in the format expected by LLMListItems.
  AvailableLLMs: [...initLLMProviders],
  setAvailableLLMs: (llmProviderList) => {
    set({ AvailableLLMs: llmProviderList });
  },

  aiFeaturesProvider: "OpenAI",
  setAIFeaturesProvider: (llmProvider) => {
    set({ aiFeaturesProvider: llmProvider });
  },

  // Keeping track of LLM API keys
  apiKeys: initialAPIKeys,
  setAPIKeys: (apiKeys) => {
    // Filter out any empty or incorrectly formatted API key values:
    const new_keys = transformDict(
      apiKeys,
      (key) =>
        (typeof apiKeys[key] === "string" && apiKeys[key].length > 0) ||
        key === "OpenAI_BaseURL",
    );
    // Only update API keys present in the new array; don't delete existing ones:
    set({ apiKeys: { ...get().apiKeys, ...new_keys } });
  },

  // Flags to toggle on or off features across the application
  flags: initialFlags,
  getFlag: (flagName) => {
    return get().flags[flagName] ?? false;
  },
  setFlag: (flagName, flagValue) => {
    const flags = { ...get().flags };
    flags[flagName] = flagValue;
    set({ flags });
  },

  // State shared across the application, for forcing redraws upon change.
  state: {},
  setState: (key, value) => {
    set((st) => ({
      ...st,
      state: {
        ...st.state,
        [key]: value,
      },
    }));
  },
  importState: (state) => {
    set((st) => ({
      ...st,
      state,
    }));
  },

  // Keep track of LLM colors, to ensure color consistency across various plots and displays
  llmColors: initialLLMColors,

  // Gets the color for the model named 'llm_name' in llmColors; returns undefined if not found.
  getColorForLLM: (llm_name) => {
    const colors = get().llmColors;
    if (llm_name in colors) return colors[llm_name];
    return undefined;
  },

  // Gets the color for the specified LLM. If not found, generates a new (ideally unique) color
  // and saves it to the llmColors dict.
  getColorForLLMAndSetIfNotFound: (llm_name) => {
    let color = get().getColorForLLM(llm_name);
    if (color) return color;
    color = get().genUniqueLLMColor();
    get().setColorForLLM(llm_name, color);
    return color;
  },

  // Generates a unique color not yet used in llmColors (unless # colors is large)
  genUniqueLLMColor: () => {
    const used_colors = new Set(Object.values(get().llmColors));
    const get_unused_color = (all_colors: string[]) => {
      for (let i = 0; i < all_colors.length; i++) {
        const color = all_colors[i];
        if (!used_colors.has(color)) return color;
      }
      return undefined;
    };

    let unique_color = get_unused_color(llmColorPalette);
    if (unique_color) return unique_color;

    // If we've reached here, we've exhausted all colors in the LLM palette. As a backup,
    // we'll use the color palette for vars, and try that:
    unique_color = get_unused_color(varColorPalette);
    if (unique_color) return unique_color;

    // If we've reached here, we've run out of all predefined colors.
    // Choose one to repeat, at random:
    const all_colors = llmColorPalette.concat(varColorPalette);
    return all_colors[Math.floor(Math.random() * all_colors.length)];
  },

  // Saves the color for the specified LLM
  setColorForLLM: (llm_name, color) => {
    get().llmColors[llm_name] = color;
  },

  // Resets (removes) all LLM colors
  resetLLMColors: () => {
    set({
      llmColors: {},
    });
  },

  inputEdgesForNode: (sourceNodeId) => {
    return get().edges.filter((e) => e.target === sourceNodeId);
  },
  outputEdgesForNode: (sourceNodeId) => {
    return get().edges.filter((e) => e.source === sourceNodeId);
  },
  pingOutputNodes: (sourceNodeId) => {
    const out_nodes = get()
      .outputEdgesForNode(sourceNodeId)
      .map((e) => e.target);
    out_nodes.forEach((n) => {
      const node = get().getNode(n);
      if (
        node?.type !== undefined &&
        refreshableOutputNodeTypes.has(node.type)
      ) {
        get().setDataPropsForNode(node.id, { refresh: true });
      }
    });
  },
  output: (sourceNodeId: string, sourceHandleKey: string) => {
    const src_node = get().getNode(sourceNodeId);
    if (!src_node) return null;

    // Handle project node attributes
    if (src_node.type === "project" && src_node.data.projectAttributes) {
      const attrs = src_node.data.projectAttributes;
      if (sourceHandleKey.startsWith("attribute-")) {
        const attrName = sourceHandleKey.replace("attribute-", "");
        return attrs[attrName] ? [attrs[attrName]] : null;
      }
      return Object.values(attrs);
    }

    // If the source node has tabular data, use that:
    if (src_node.type === "table") {
      if (
        ("sel_rows" in src_node.data || "rows" in src_node.data) &&
        "columns" in src_node.data
      ) {
        const rows: TabularDataRowType[] =
          src_node.data.sel_rows ?? src_node.data.rows;
        const columns: TabularDataColType[] = src_node.data.columns;

        // The sourceHandleKey is the key of the column in the table that we're interested in:
        const src_col = columns.find((c) => c.header === sourceHandleKey);
        if (src_col !== undefined) {
          // Construct a lookup table from column key to header name,
          // as the 'metavars' dict should be keyed by column *header*, not internal key:
          const col_header_lookup: Dict<string> = {};
          columns.forEach((c) => {
            col_header_lookup[c.key] = c.header;
          });

          // Extract all the data for every row of the source column, appending the other values as 'meta-vars':
          return rows
            .map((row) => {
              const row_keys = Object.keys(row);

              // Check if this is an 'empty' row (with all empty strings); if so, skip it:
              if (
                row_keys.every(
                  (key) =>
                    key === "__uid" ||
                    !row[key] ||
                    (typeof row[key] === "string" && row[key].trim() === ""),
                )
              )
                return undefined;

              const row_excluding_col: Dict<string> = {};
              row_keys.forEach((key) => {
                if (key !== src_col.key && key !== "__uid")
                  row_excluding_col[col_header_lookup[key]] =
                    row[key].toString();
              });
              return {
                // We escape any braces in the source text before they're passed downstream.
                // This is a special property of tabular data nodes: we don't want their text to be treated as prompt templates.
                text: escapeBraces(
                  src_col.key in row ? row[src_col.key].toString() : "",
                ),
                metavars: row_excluding_col,
                associate_id: row.__uid, // this is used by the backend to 'carry' certain values together
              };
            })
            .filter((r) => r !== undefined);
        } else {
          console.error(
            `Could not find table column with source handle name ${sourceHandleKey}`,
          );
          return null;
        }
      }
    } else {
      // Get the data related to that handle:
      if ("fields" in src_node.data) {
        if (Array.isArray(src_node.data.fields)) return src_node.data.fields;
        else {
          // We have to filter over a special 'fields_visibility' prop, which
          // can select what fields get output:
          if ("fields_visibility" in src_node.data)
            return Object.values(
              transformDict(
                src_node.data.fields,
                // eslint-disable-next-line
                (fid) => src_node.data.fields_visibility[fid] !== false,
              ),
            );
          // return all field values
          else return Object.values(src_node.data.fields);
        }
      }
      // NOTE: This assumes it's on the 'data' prop, with the same id as the handle:
      else return src_node.data[sourceHandleKey];
    }
  },

  // Get the types of nodes attached immediately as input to the given node
  getImmediateInputNodeTypes: (_targetHandles, node_id) => {
    const getNode = get().getNode;
    const edges = get().edges;
    const inputNodeTypes: string[] = [];
    edges.forEach((e) => {
      if (
        e.target === node_id &&
        typeof e.targetHandle === "string" &&
        _targetHandles.includes(e.targetHandle)
      ) {
        const src_node = getNode(e.source);
        if (src_node && src_node.type !== undefined)
          inputNodeTypes.push(src_node.type);
      }
    });
    return inputNodeTypes;
  },

  // Pull all inputs needed to request responses.
  // Returns [prompt, vars dict]
  pullInputData: (_targetHandles, node_id) => {
    // Functions/data from the store:
    const getNode = get().getNode;
    const output = get().output;
    const edges = get().edges;

    // Helper function to store collected data in dict:
    const store_data = (
      _texts: PromptVarType[],
      _varname: string,
      _data: PromptVarsDict,
    ) => {
      if (_varname in _data) _data[_varname] = _data[_varname].concat(_texts);
      else _data[_varname] = _texts;
    };

    // Pull data from each source recursively:
    const pulled_data = {};
    const get_outputs = (
      varnames: string[],
      nodeId: string,
      var_history: Set<string>,
    ) => {
      varnames.forEach((varname) => {
        // Check for duplicate variable names
        if (var_history.has(String(varname).toLowerCase()))
          throw new DuplicateVariableNameError(varname);

        // Add to unique name tally
        var_history.add(String(varname).toLowerCase());

        // Find the relevant edge(s):
        edges.forEach((e) => {
          if (e.target === nodeId && e.targetHandle === varname) {
            // Get the immediate output:
            const out =
              e.sourceHandle != null
                ? output(e.source, e.sourceHandle)
                : undefined;
            if (!out || !Array.isArray(out) || out.length === 0) return;

            // Check the format of the output. Can be str or dict with 'text' and more attrs:
            if (typeof out[0] === "object") {
              out.forEach((obj) => store_data([obj], varname, pulled_data));
            } else {
              // Save the list of strings from the pulled output under the var 'varname'
              store_data(out, varname, pulled_data);
            }

            // Get any vars that the output depends on, and recursively collect those outputs as well:
            const n_vars = getNode(e.source)?.data?.vars;
            if (n_vars && Array.isArray(n_vars) && n_vars.length > 0)
              get_outputs(n_vars, e.source, var_history);
          }
        });
      });
    };
    get_outputs(_targetHandles, node_id, new Set<string>());

    return pulled_data;
  },

  /**
   * Sets select 'data' properties for node 'id'. This updates global state, and forces re-renders. Use sparingly.
   * @param {*} id The id of the node to set 'data' properties for.
   * @param {*} data_props The properties to set on the node's 'data'.
   */
  setDataPropsForNode: (id: string, data_props: Dict) => {
    const _set = (nds: Node[]) =>
      nds.map((n) => {
        if (n.id === id) {
          for (const key of Object.keys(data_props))
            n.data[key] = data_props[key];
          n.data = deepcopy(n.data);
        }
        return n;
      });
    set({
      nodes: _set(get().nodes),
    });
  },
  getNode: (id) => get().nodes.find((n) => n.id === id),
  addNode: (node: Node | string, type?: string, data?: Dict<any>) => {
    // Ensure node is an object with proper ID
    const nodeObj =
      typeof node === "string"
        ? {
            id: `${node}-${Date.now()}`,
            type: type || node,
            data: data || {},
            position: { x: 0, y: 0 },
            selected: false,
          }
        : {
            ...node,
            id: typeof node.id === "string" ? node.id : String(node.id),
            position: { x: 0, y: 0 },
            selected: false,
          };

    // Only deselect and select if not explicitly set
    if (nodeObj.selected === undefined) {
      get().deselectAllNodes();
      nodeObj.selected = true;
    }

    // Add the node to the internal state
    const currentNodes = get().nodes;
    if (!Array.isArray(currentNodes)) {
      set({ nodes: [nodeObj] });
    } else {
      set({ nodes: [...currentNodes, nodeObj] });
    }
  },
  removeNode: (id) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
    });
  },
  deselectAllNodes: () => {
    // Ensure nodes is an array before mapping
    const currentNodes = get().nodes;
    if (!Array.isArray(currentNodes)) return;

    set({
      nodes: currentNodes.map((n) => ({
        ...n,
        selected: false,
      })),
    });
  },
  bringNodeToFront: (id) => {
    set({
      nodes: get().nodes.map((n) => {
        n.selected = n.id === id;
        return n;
      }),
    });
  },
  duplicateNode: (id, offset) => {
    const nodes = get().nodes;
    const node = nodes.find((n) => n.id === id);
    if (!node) {
      // console.error(`Could not duplicate node: No node found with id ${id}`);
      return undefined;
    }
    // Deep copy node data
    const dup = JSON.parse(JSON.stringify(node));
    // Shift position
    dup.position.x += offset && offset.x !== undefined ? offset.x : 0;
    dup.position.y += offset && offset.y !== undefined ? offset.y : 0;
    // Change id to new unique id
    dup.id = `${dup.type}-${Date.now()}`;
    // Return the duplicated node (does not add it to ReactFlow nodes; use addNode for that!)
    return dup;
  },
  setNodes: (newNodes) => {
    set({
      nodes: typeof newNodes === "function" ? newNodes(get().nodes) : newNodes,
    });
  },
  setEdges: (newEdges) => {
    const currentEdges = get().edges;
    set({
      edges:
        typeof newEdges === "function"
          ? newEdges(Array.isArray(currentEdges) ? currentEdges : [])
          : Array.isArray(newEdges)
            ? newEdges
            : [],
    });
  },
  removeEdge: (id) => {
    set({
      edges: applyEdgeChanges([{ id, type: "remove" }], get().edges),
    });
  },
  onNodesChange: (changes) => {
    // Get all selection changes
    const selectionChanges = changes.filter(
      (change) => change.type === "select",
    );

    if (selectionChanges.length > 0) {
      // Update nodes first
      const newNodes = applyNodeChanges(changes, get().nodes);

      // Then get all selected nodes IDs
      const selectedNodes = newNodes
        .filter((node) => node.selected)
        .map((node) =>
          typeof node.id === "string" ? node.id : String(node.id),
        );

      // Update both nodes and selectedNodes
      set({
        nodes: newNodes,
        selectedNodes,
      });
    } else {
      // If no selection changes, just update nodes
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    }
  },
  onEdgesChange: (changes) => {
    const currentEdges = get().edges;
    set({
      edges: Array.isArray(currentEdges)
        ? applyEdgeChanges(changes, currentEdges)
        : [],
    });
  },
  onConnect: (connection) => {
    const currentEdges = get().edges;
    if (!Array.isArray(currentEdges)) {
      set({ edges: [] });
      return;
    }

    // Get the target node information
    const target = connection.target
      ? get().getNode(connection.target)
      : undefined;
    if (target === undefined) return;

    if (
      target.type === "vis" ||
      target.type === "inspect" ||
      target.type === "simpleval"
    ) {
      get().setDataPropsForNode(target.id, { input: connection.source });
    }

    // Ping target node to fresh if necessary
    if (
      typeof target?.type === "string" &&
      refreshableOutputNodeTypes.has(target.type)
    ) {
      get().setDataPropsForNode(target.id, { refresh: true });
    }

    connection = connection as Edge;
    connection.interactionWidth = 40;
    connection.markerEnd = { type: MarkerType.Arrow, width: 22, height: 22 }; // 22px
    connection.type = "default";

    set({
      edges: addEdge(connection, currentEdges),
    });
  },

  // Project related state
  projects: [],
  tasks: [],
  selectedProject: null,
  company: null,

  // Project related methods
  setProjects: (projects) => {
    console.log("Store updating projects:", projects);
    set((state) => ({
      ...state,
      projects,
    }));
  },
  setTasks: (tasks) => {
    console.log("Store updating tasks:", tasks);
    set((state) => ({
      ...state,
      tasks,
    }));
  },
  setSelectedProject: (project) => {
    console.log("Store updating selected project:", project);
    set((state) => ({
      ...state,
      selectedProject: project,
    }));
  },
  setCompany: (company) => {
    console.log("Store updating company:", company);
    set((state) => ({
      ...state,
      company,
    }));
  },

  // Add group-related state
  groups: [],
  selectedNodes: [],

  // Add group-related methods
  createGroup: (name, description) => {
    const newGroup: Group = {
      id: `group-${uuid()}`,
      name,
      description,
      nodes: get().selectedNodes,
      isCollapsed: false,
    };
    set((state) => ({ groups: [...state.groups, newGroup] }));
    return newGroup.id;
  },

  addNodesToGroup: (groupId, nodeIds) => {
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === groupId
          ? { ...group, nodes: [...new Set([...group.nodes, ...nodeIds])] }
          : group,
      ),
    }));
  },

  removeNodesFromGroup: (groupId, nodeIds) => {
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              nodes: group.nodes.filter((id) => !nodeIds.includes(id)),
            }
          : group,
      ),
    }));
  },

  deleteGroup: (groupId) => {
    set((state) => ({
      groups: state.groups.filter((group) => group.id !== groupId),
    }));
  },

  setSelectedNodes: (nodeIds) => {
    set({ selectedNodes: nodeIds });
  },

  createFlowFromSelection: (name, description) => {
    const { nodes, edges, selectedNodes } = get();
    const selectedNodeSet = new Set(selectedNodes);

    // Get selected nodes and related edges
    const groupNodes = nodes.filter((n) => selectedNodeSet.has(n.id));
    const groupEdges = Array.isArray(edges)
      ? edges.filter(
          (e) => selectedNodeSet.has(e.source) && selectedNodeSet.has(e.target),
        )
      : [];

    // Create new flow from selection
    const newFlow = FlowService.createFlow(name, description);
    const flowData: FlowData = {
      nodes: groupNodes,
      edges: groupEdges,
      viewport: { x: 0, y: 0, zoom: 1 },
      groups: [],
    };

    newFlow.data = flowData;
    FlowService.updateFlow(newFlow.id, newFlow);

    return newFlow.id;
  },

  selectedGroup: null,

  setSelectedGroup: (groupId) => {
    set({ selectedGroup: groupId });
  },

  selectNodesInGroup: (groupId) => {
    const group = get().groups.find((g) => g.id === groupId);
    if (group) {
      // Deselect all nodes first
      set((state) => ({
        nodes: state.nodes.map((node) => ({
          ...node,
          selected: group.nodes.includes(node.id),
        })),
        selectedNodes: group.nodes,
      }));
    }
  },

  // Add a helper method to check selection
  getSelectedNodes: () => {
    return get()
      .nodes.filter((node) => node.selected)
      .map((node) => (typeof node.id === "string" ? node.id : String(node.id)));
  },

  // Add method to sync selection state
  syncSelectedNodes: () => {
    const selectedNodes = get().getSelectedNodes();
    set({ selectedNodes });
  },
  setGroups: (groups: Group[]) => set({ groups }),

  updateGroup: (groupId: string, updates: Partial<Group>) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, ...updates } : g,
      ),
    }));
  },

  ungroup: (groupNodeId: string) => {
    const groupNode = get().nodes.find((n) => n.id === groupNodeId);
    if (!groupNode || !groupNode.data) return;

    const { nodes: groupedNodes, connections } = groupNode.data;
    const { position } = groupNode;

    // Remove the group node
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== groupNodeId),
      groups: state.groups.filter((g) => g.id !== groupNode.data.groupId),
    }));

    // Add back the original nodes with adjusted positions
    const newNodes = groupedNodes.map((node: Node) => {
      // Find the original node in the group's data to get its full configuration
      const originalNode = groupNode.data.nodes.find(
        (n: { id: string }) => n.id === node.id,
      );

      return {
        id: node.id,
        type: node.type,
        position: {
          x: position.x + Math.random() * 200 - 100, // Spread nodes around group position
          y: position.y + Math.random() * 200 - 100,
        },
        data: {
          // Preserve the original node's data
          name: originalNode?.name || node.type,
          ...node, // Include any other data from the original node
        },
        selected: false,
      } as Node;
    });

    // Add back the original edges
    const newEdges = connections
      .filter((conn: { source: string; target: string }) => {
        const sourceExists = groupedNodes.some(
          (n: Node) => n.id === conn.source,
        );
        const targetExists = groupedNodes.some(
          (n: Node) => n.id === conn.target,
        );
        return sourceExists && targetExists;
      })
      .map((conn: { source: string; target: string }) => ({
        id: `${conn.source}-${conn.target}`,
        source: conn.source,
        target: conn.target,
      }));

    // Update the store with new nodes and edges
    set((state) => ({
      nodes: [...state.nodes, ...newNodes],
      edges: [...state.edges, ...newEdges],
    }));
  },

  // ReactFlowInstance
  rfInstance: null,
  setRfInstance: (instance) => set({ rfInstance: instance }),

  // Viewport
  viewport: { x: 0, y: 0, zoom: 1 },
  setViewport: (viewport) => set({ viewport }),

  // Cache
  cache: {},
  restoreCache: (cache) => set({ cache }),
}));

export default useStore;
