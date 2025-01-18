import React from "react";
import { FlowButton } from "../common/FlowButton";
import { useModalManagement } from "../../hooks/useModalManagement";

const ExampleFlowButton: React.FC = () => {
  const { onClickExamples } = useModalManagement();
  return (
    <FlowButton onClick={onClickExamples} variant="filled">
      Example Flows
    </FlowButton>
  );
};

export default ExampleFlowButton;
