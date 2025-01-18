import { useCallback } from "react";
import { FlowService } from "../services/FlowService";
import { ReactFlowInstance } from "reactflow";
import { GlobalSettingsModalRef } from "../components/modals/GlobalSettingsModal";
import { Flow } from "../types/flow";

export const useFlowActions = (
  settingsModal?: React.RefObject<GlobalSettingsModalRef>,
  rfInstance?: ReactFlowInstance | null,
  currentFlow?: Flow | null,
) => {
  const onClickSettings = useCallback(() => {
    if (settingsModal?.current) settingsModal.current.trigger();
  }, [settingsModal]);

  const onClickNewFlow = useCallback(() => {
    const newFlow = FlowService.createFlow("New Flow");
    return newFlow;
  }, []);

  const createSnapshot = useCallback(
    (name?: string, description?: string) => {
      if (!currentFlow) return;
      return FlowService.createSnapshot(currentFlow.id, name, description);
    },
    [currentFlow],
  );

  const restoreSnapshot = useCallback(
    (snapshotId: string) => {
      if (!rfInstance) return;
      const snapshots = FlowService.getSnapshots();
      const snapshot = snapshots.find((s) => s.id === snapshotId);
      if (!snapshot) return;

      // Update the flow with snapshot data
      if (currentFlow) {
        FlowService.updateFlow(currentFlow.id, {
          data: snapshot.data,
          updatedAt: new Date().toISOString(),
        });
      }
    },
    [rfInstance, currentFlow],
  );

  return {
    onClickSettings,
    onClickNewFlow,
    createSnapshot,
    restoreSnapshot,
  };
};
