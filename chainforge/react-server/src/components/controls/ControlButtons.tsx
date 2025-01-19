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
    saveFlow,
    resetFlow,
    createSnapshot,
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
          disabled={!currentFlow}
        >
          Export
        </Button>
        <Button
          onClick={importFlowFromFile}
          size="sm"
          variant="outline"
          bg="#eee"
          compact
          mr="xs"
        >
          Import
        </Button>
        <Button
          onClick={saveFlow}
          size="sm"
          variant="outline"
          bg="#eee"
          compact
          mr="xs"
          disabled={!currentFlow}
        >
          Save
        </Button>
        <Button
          onClick={() => createSnapshot()}
          size="sm"
          variant="outline"
          bg="#eee"
          compact
          mr="xs"
          disabled={!currentFlow}
        >
          Snapshot
        </Button>
        <Button
          onClick={resetFlow}
          size="sm"
          variant="outline"
          bg="#eee"
          compact
          disabled={!currentFlow}
        >
          Reset
        </Button>
      </div>
      <div style={{ position: "fixed", right: "10px", top: "10px", zIndex: 8 }}>
        <ShareFlowButton />
        <CreateNewFlowButton />
        <ExampleFlowButton />
        <Button
          onClick={() => onClickSettings(settingsModal.current!)}
          size="sm"
          variant="gradient"
          compact
          disabled={!settingsModal.current}
        >
          <IconSettings size={"90%"} />
        </Button>
      </div>
    </>
  );
};
