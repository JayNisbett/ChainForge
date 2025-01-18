import { useRef, useState } from "react";
import { GlobalSettingsModalRef } from "../components/modals/GlobalSettingsModal";
import { ExampleFlowsModalRef } from "../components/modals/ExampleFlowsModal";
import { AreYouSureModalRef } from "../components/modals/AreYouSureModal";
import { GroupModalRef } from "../components/modals/GroupModal";

export const useModalManagement = () => {
  const settingsModal = useRef<GlobalSettingsModalRef>(null);
  const examplesModal = useRef<ExampleFlowsModalRef>(null);
  const confirmationModal = useRef<AreYouSureModalRef>(null);
  const groupModal = useRef<GroupModalRef>(null);

  const [confirmationDialogProps, setConfirmationDialogProps] = useState<{
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    title: "Confirm action",
    message: "Are you sure?",
  });

  const openSettingsModal = () => settingsModal.current?.trigger();
  const openExamplesModal = () => examplesModal.current?.trigger();
  const openConfirmationModal = () => confirmationModal.current?.trigger();
  const openGroupModal = () => groupModal.current?.trigger();

  const onClickExamples = () => {
    if (examplesModal && examplesModal.current) examplesModal.current.trigger();
  };
  const onClickSettings = () => {
    if (settingsModal && settingsModal.current) settingsModal.current.trigger();
  };

  return {
    settingsModal,
    examplesModal,
    confirmationModal,
    groupModal,
    confirmationDialogProps,
    setConfirmationDialogProps,
    openSettingsModal,
    openExamplesModal,
    openConfirmationModal,
    openGroupModal,
    onClickExamples,
    onClickSettings,
  };
};
