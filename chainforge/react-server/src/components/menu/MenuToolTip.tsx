import React from "react";
import { Tooltip } from "@mantine/core";

const MenuTooltip = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  return (
    <Tooltip
      label={label}
      position="right"
      width={200}
      multiline
      withArrow
      arrowSize={10}
    >
      {children}
    </Tooltip>
  );
};

export default MenuTooltip;
