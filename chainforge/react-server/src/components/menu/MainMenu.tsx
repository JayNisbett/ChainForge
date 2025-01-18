import React, { useRef, useContext } from "react";
import { Menu, Button, Text } from "@mantine/core";
import {
  IconTextPlus,
  IconForms,
  IconRuler2,
  IconTerminal,
  IconRobot,
  IconAbacus,
  IconArrowMerge,
  IconArrowsSplit,
  IconLayersSubtract,
  IconSettingsAutomation,
} from "@tabler/icons-react";
import MenuTooltip from "./MenuToolTip";
import promptData from "../../backend/aiPromptNodeData.json";
import promptCategoriesData from "../../backend/aiPromptCategoriesData.json";
import { addPromptNodesFromData } from "../../utils/nodeGenerator";
import { AlertContext } from "../AlertProvider";
import { GroupModalRef } from "../modals/GroupModal";
import { useStore } from "../../store/store";
import { PromptData } from "../../types/prompt";
import { useNodeCreation } from "../../hooks/useNodeCreation";
const MainMenu: React.FC = () => {
  const showAlert = useContext(AlertContext);
  const groupModal = useRef<GroupModalRef>(null);
  const selectedNodes = useStore((state) => state.selectedNodes);
  const rfInstance = useStore((state) => state.rfInstance);
  const {
    addProjectNode,
    addTaskNode,
    addTextFieldsNode,
    addItemsNode,
    addTabularDataNode,
    addPromptNode,
    addSimpleEvalNode,
    addLLMNode,
    addCodeEvaluatorNode,
    addLLMEvaluatorNode,
    addMultiEvalNode,
    addVisNode,
    addInspectNode,
    addScriptNode,
    addJoinNode,
    addSplitNode,
    addGroupNode,
    addDynamicPromptNode,
  } = useNodeCreation(rfInstance);

  // Add a function to load all prompts
  const loadPromptNodes = () => {
    if (promptData.status && Array.isArray(promptData.statusText)) {
      const typedPromptData = promptData.statusText as PromptData[];
      addPromptNodesFromData(typedPromptData, addNode);
    }
  };

  return (
    <>
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
            <Menu.Item onClick={addItemsNode} icon={<IconForms size="16px" />}>
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
                        prompt.fields[0]?.placeHolder || "Create a new prompt"
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
                    <Menu.Item disabled>No prompts in this category</Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            ))
          ) : (
            <Menu.Item disabled>No dynamic prompts available</Menu.Item>
          )}
        </Menu.Dropdown>
      </Menu>
    </>
  );
};

export default MainMenu;
