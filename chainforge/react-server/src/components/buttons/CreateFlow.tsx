import React from "react";
import { Button } from "@mantine/core";
import { onClickNewFlow } from "../../utils/app";

const CreateNewFlowButton: React.FC = () => {
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
