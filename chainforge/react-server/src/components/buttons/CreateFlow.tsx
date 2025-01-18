import React from "react";
import { Button } from "@mantine/core";
import { useFlowActions } from "../../hooks/useFlowActions";

const CreateNewFlowButton: React.FC = () => {
  const { onClickNewFlow } = useFlowActions();

  return (
    <Button
      onClick={onClickNewFlow}
      size="sm"
      variant="outline"
      bg="#eee"
      compact
      mr="xs"
      style={{ float: "left" }}
    >
      New Flow
    </Button>
  );
};

export default CreateNewFlowButton;
