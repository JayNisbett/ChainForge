import React from "react";
import { Menu } from "@mantine/core";
import MenuTooltip from "./MenuToolTip";

interface MenuItem {
  label: string;
  tooltip: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

interface MenuSectionProps {
  label: string;
  items: MenuItem[];
}

export const MenuSection: React.FC<MenuSectionProps> = ({ label, items }) => {
  return (
    <>
      <Menu.Label>{label}</Menu.Label>
      {items.map((item) => (
        <MenuTooltip key={item.label} label={item.tooltip}>
          <Menu.Item onClick={item.onClick} icon={item.icon}>
            {item.label}
          </Menu.Item>
        </MenuTooltip>
      ))}
    </>
  );
};
