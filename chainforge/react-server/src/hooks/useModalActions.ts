import { useCallback } from "react";
import { GlobalSettingsModalRef } from "../components/modals/GlobalSettingsModal";
import { ExampleFlowsModalRef } from "../components/modals/ExampleFlowsModal";

export const useModalActions = (
  settingsModal: React.RefObject<GlobalSettingsModalRef>,
  examplesModal: React.RefObject<ExampleFlowsModalRef>,
) => {
  const onClickExamples = useCallback(() => {
    if (examplesModal.current) examplesModal.current.trigger();
  }, [examplesModal]);

  const onClickSettings = useCallback(() => {
    if (settingsModal.current) settingsModal.current.trigger();
  }, [settingsModal]);

  return {
    onClickExamples,
    onClickSettings,
  };
};
