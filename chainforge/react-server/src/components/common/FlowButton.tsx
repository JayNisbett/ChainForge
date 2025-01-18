import React from "react";
import { Button, ButtonProps } from "@mantine/core";

interface FlowButtonProps extends ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export const FlowButton: React.FC<FlowButtonProps> = ({
  onClick,
  children,
  ...props
}) => {
  return (
    <Button
      onClick={onClick}
      size="sm"
      variant="outline"
      bg="#eee"
      compact
      mr="xs"
      style={{ float: "left" }}
      {...props}
    >
      {children}
    </Button>
  );
};
