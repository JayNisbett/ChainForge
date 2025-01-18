import TextFieldsNode from "../components/nodes/TextFieldsNode"; // Import a custom node
import PromptNode from "../components/nodes/PromptNode";
import CodeEvaluatorNode from "../components/nodes/CodeEvaluatorNode";
import VisNode from "../components/nodes/VisNode";
import InspectNode from "../components/nodes/InspectorNode";
import ScriptNode from "../components/nodes/ScriptNode";
import { AlertModalContext } from "../components/modals/AlertModal";
import ItemsNode from "../components/nodes/ItemsNode";
import TabularDataNode from "../components/nodes/TabularDataNode";
import JoinNode from "../components/nodes/JoinNode";
import SplitNode from "../components/nodes/SplitNode";
import CommentNode from "../components/nodes/CommentNode";
import LLMEvaluatorNode from "../components/nodes/LLMEvalNode";
import SimpleEvalNode from "../components/nodes/SimpleEvalNode";
import ProjectNode from "../components/nodes/ProjectNode";
import TaskNode from "../components/nodes/TaskNode";
import GroupNode from "../components/nodes/GroupNode";
import DynamicPromptNode from "../components/nodes/DynamicPromptNode";
import MultiEvalNode from "../components/nodes/MultiEvalNode";
import RemoveEdge from "../components/edges/RemoveEdge";

export const nodeTypes = {
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

export const edgeTypes = {
  default: RemoveEdge,
};
