import React, { useState, useCallback } from "react";
import { Handle, Position } from "reactflow";
import { Box, Text, Button, Stack, Divider, Group } from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconFolder,
  IconUnlink,
} from "@tabler/icons-react";
import useStore from "../../store/store";
import BaseNode from "./BaseNode";
import { NodeLabel } from "./NodeLabelComponent";

interface GroupNodeData {
  name: string;
  description?: string;
  groupId?: string;
  nodes: Array<{
    id: string;
    type: string;
    name?: string;
  }>;
  connections: Array<{
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
  isCollapsed?: boolean;
}

interface GroupNodeProps {
  id: string;
  data: GroupNodeData;
  selected: boolean;
}

export default function GroupNode({ id, data, selected }: GroupNodeProps) {
  const [isCollapsed, setIsCollapsed] = useState(data?.isCollapsed || false);

  const { groups, ungroup, updateGroup } = useStore((state) => ({
    groups: state.groups,
    ungroup: state.ungroup,
    updateGroup: state.updateGroup,
  }));

  const group = data?.groupId
    ? groups.find((g) => g.id === data.groupId)
    : null;

  // Update group collapse state
  const handleCollapse = useCallback(() => {
    const newIsCollapsed = !isCollapsed;
    setIsCollapsed(newIsCollapsed);
    if (group) {
      updateGroup(group.id, {
        ...group,
        isCollapsed: newIsCollapsed,
      });
    }
  }, [isCollapsed, group, updateGroup]);

  // Handle ungroup action
  const handleUngroup = useCallback(() => {
    console.log("Ungrouping group node", data);
    if (data?.groupId) {
      ungroup(data.groupId);
    }
  }, [data?.groupId, ungroup]);

  // Helper to get node display name
  const getNodeDisplayName = (node: { type: string; name?: string }) => {
    return node.name || `${node.type} Node`;
  };

  // Create a map of connections for display
  const connectionMap =
    data?.connections?.reduce((acc, conn) => {
      const sourceNode = data?.nodes?.find((n) => n.id === conn.source);
      const targetNode = data?.nodes?.find((n) => n.id === conn.target);
      if (sourceNode && targetNode) {
        acc.push(
          `${getNodeDisplayName(sourceNode)} → ${getNodeDisplayName(targetNode)}`,
        );
      }
      return acc;
    }, [] as string[]) || [];

  if (!data) {
    console.warn("GroupNode received no data", { id, selected });
    return null;
  }

  return (
    <BaseNode
      classNames="group-node"
      nodeId={id}
      style={{
        minWidth: "200px",
        minHeight: "100px",
        visibility: "visible",
      }}
    >
      <NodeLabel
        title={data.name || "Group Node"}
        nodeId={id}
        icon={<IconFolder size={16} />}
      />

      <Handle
        type="target"
        position={Position.Left}
        style={{ visibility: "visible" }}
      />

      <Stack spacing="xs" p="sm">
        <Group position="apart" align="center">
          <Button
            size="xs"
            variant="subtle"
            color="red"
            leftIcon={<IconUnlink size={14} />}
            onClick={handleUngroup}
          >
            Ungroup
          </Button>
          <Button
            size="xs"
            variant="subtle"
            onClick={handleCollapse}
            rightIcon={
              isCollapsed ? (
                <IconChevronDown size={14} />
              ) : (
                <IconChevronUp size={14} />
              )
            }
          >
            {isCollapsed ? "Expand" : "Collapse"}
          </Button>
        </Group>

        {data.description && (
          <Text size="xs" color="dimmed">
            {data.description}
          </Text>
        )}

        {!isCollapsed && (
          <>
            <Divider />
            <Text size="sm" weight={500}>
              Contained Nodes:
            </Text>
            {data.nodes?.map((node) => (
              <Text key={node.id} size="xs">
                • {getNodeDisplayName(node)}
              </Text>
            ))}

            {connectionMap.length > 0 && (
              <>
                <Text size="sm" weight={500} mt="xs">
                  Connections:
                </Text>
                {connectionMap.map((conn, idx) => (
                  <Text key={idx} size="xs">
                    • {conn}
                  </Text>
                ))}
              </>
            )}
          </>
        )}
      </Stack>

      <Handle
        type="source"
        position={Position.Right}
        style={{ visibility: "visible" }}
      />
    </BaseNode>
  );
}
