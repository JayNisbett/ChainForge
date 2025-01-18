import React from "react";
import { FlowButton } from "../common/FlowButton";

const ExampleFlowButton: React.FC = () => {
  return (
    <FlowButton onClick={onClickExamples} variant="filled">
      Example Flows
    </FlowButton>
  );
};

export default ExampleFlowButton;
