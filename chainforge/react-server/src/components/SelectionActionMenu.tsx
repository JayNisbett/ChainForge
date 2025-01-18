import React, { useEffect, useState } from "react";
import { Box, Button, Group } from "@mantine/core";
import { IconLayersSubtract, IconLayersIntersect } from "@tabler/icons-react";
import useStore from "../store/store";

interface SelectionActionMenuProps {
  onCreateGroup: () => void;
}

export function SelectionActionMenu({
  onCreateGroup,
}: SelectionActionMenuProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const selectedNodes = useStore((state) => state.selectedNodes);
  const nodes = useStore((state) => state.nodes);

  useEffect(() => {
    console.log("Selected nodes:", selectedNodes); // Debug log

    if (selectedNodes.length < 2) return;

    // Calculate the bounding box of selected nodes
    const selectedNodeElements = selectedNodes
      .map((id) => nodes.find((n) => n.id === id))
      .filter((n) => n !== undefined);

    if (selectedNodeElements.length === 0) return;

    // Find the top-most point of the selection
    const minY = Math.min(
      ...selectedNodeElements.map((node) => node!.position.y),
    );
    const avgX =
      selectedNodeElements.reduce((sum, node) => sum + node!.position.x, 0) /
      selectedNodeElements.length;

    // Position the menu above the selection
    setPosition({
      x: avgX,
      y: minY - 50, // 50px above the top-most node
    });
  }, [selectedNodes, nodes]);

  // Add debug render
  if (selectedNodes.length < 2) {
    console.log("Not enough nodes selected:", selectedNodes.length);
    return null;
  }

  return (
    <Box
      sx={(theme) => ({
        position: "absolute",
        left: position.x,
        top: position.y,
        transform: "translateX(-50%)", // Center horizontally
        zIndex: 1000,
        backgroundColor: theme.colors.gray[0],
        padding: theme.spacing.xs,
        borderRadius: theme.radius.md,
        boxShadow: theme.shadows.md,
        border: `1px solid ${theme.colors.gray[3]}`,
      })}
    >
      <Group spacing="xs">
        <Button
          size="xs"
          leftIcon={<IconLayersSubtract size={14} />}
          onClick={onCreateGroup}
        >
          Create Group
        </Button>
        <Button
          size="xs"
          leftIcon={<IconLayersIntersect size={14} />}
          onClick={onCreateGroup}
          variant="light"
        >
          Save as Flow
        </Button>
      </Group>
    </Box>
  );
}
