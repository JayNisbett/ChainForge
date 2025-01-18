import React from "react";
import { Button } from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import ShareFlowButton from "../buttons/ShareFlow";
import CreateNewFlowButton from "../buttons/CreateFlow";
import ExampleFlowButton from "../buttons/ExampleFlow";
import { FlowManager } from "../FlowManager";
import MainMenu from "../menu/MainMenu";
import { Flow } from "../../types/flow";

interface ControlButtonsProps {
  onExport: () => void;
  onImport: () => void;
  onSettings: () => void;
  currentFlow?: Flow;
  onCreateFlow: (name: string, description?: string) => void;
  onLoadFlow: (flowId: string) => void;
  onCreateSnapshot: (name?: string, description?: string) => void;
  onRestoreSnapshot: (snapshotId: string) => void;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
  onExport,
  onImport,
  onSettings,
  currentFlow,
  onCreateFlow,
  onLoadFlow,
  onCreateSnapshot,
  onRestoreSnapshot,
}) => {
  return (
    <>
      <div
        id="custom-controls"
        style={{ position: "fixed", left: "10px", top: "10px", zIndex: 8 }}
      >
        <FlowManager
          currentFlow={currentFlow || null}
          onCreateFlow={onCreateFlow}
          onLoadFlow={onLoadFlow}
          onCreateSnapshot={onCreateSnapshot}
          onRestoreSnapshot={onRestoreSnapshot}
        />
        <MainMenu />
        <Button
          onClick={onExport}
          size="sm"
          variant="outline"
          bg="#eee"
          compact
          mr="xs"
        >
          Export
        </Button>
        <Button
          onClick={onImport}
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
        <Button onClick={onSettings} size="sm" variant="gradient" compact>
          <IconSettings size={"90%"} />
        </Button>
      </div>
    </>
  );
};
