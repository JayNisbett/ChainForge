import React, { useRef } from "react";
import { Button } from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import ShareFlowButton from "../buttons/ShareFlow";
import CreateNewFlowButton from "../buttons/CreateFlow";
import ExampleFlowButton from "../buttons/ExampleFlow";
import { FlowManager } from "../FlowManager";
import MainMenu from "../menu/MainMenu";
import { useFlowManagement } from "../../hooks/useFlowManagement";
import { ModelSettingsModalRef } from "../ai/models/ModelSettingsModal";
export const ControlButtons = () => {
  const {
    currentFlow,
    exportFlow,
    importFlowFromFile,
    onClickSettings,
    createFlow,
    loadFlow,
    createSnapshot,
    restoreSnapshot,
    importFlowFromJSON,
    onSelectExampleFlow,
    handleCreateGroup,
    handleCreateFlowFromSelection,
  } = useFlowManagement();

  const settingsModal = useRef<ModelSettingsModalRef>(null);
  return (
    <>
      <div
        id="custom-controls"
        style={{ position: "fixed", left: "10px", top: "10px", zIndex: 8 }}
      >
        <FlowManager />
        <MainMenu />
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
      <div style={{ position: "fixed", right: "10px", top: "10px", zIndex: 8 }}>
        <ShareFlowButton />
        <CreateNewFlowButton />
        <ExampleFlowButton />
        <Button
          onClick={() => settingsModal.current?.trigger()}
          size="sm"
          variant="gradient"
          compact
        >
          <IconSettings size={"90%"} />
        </Button>
      </div>
    </>
  );
};
