import React, { useState } from "react";
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
  data: {
    data: GroupNodeData;
    id: string;
    type: string;
    position: { x: number; y: number };
    selected: boolean;
  };
  selected: boolean;
}

export default function GroupNode({ data, selected }: GroupNodeProps) {
  const nodeData = data.data;
  const [isCollapsed, setIsCollapsed] = useState(
    nodeData?.isCollapsed || false,
  );
  const group = nodeData?.groupId
    ? useStore((state) => state.groups.find((g) => g.id === nodeData.groupId))
    : null;
  const ungroup = useStore((state) => state.ungroup);

  // Helper to get node display name
  const getNodeDisplayName = (node: { type: string; name?: string }) => {
    return node.name || `${node.type} Node`;
  };

  // Create a map of connections for display
  const connectionMap =
    nodeData?.connections?.reduce((acc, conn) => {
      const sourceNode = nodeData?.nodes?.find((n) => n.id === conn.source);
      const targetNode = nodeData?.nodes?.find((n) => n.id === conn.target);
      if (sourceNode && targetNode) {
        acc.push(
          `${getNodeDisplayName(sourceNode)} → ${getNodeDisplayName(targetNode)}`,
        );
      }
      return acc;
    }, [] as string[]) || [];

  if (!nodeData) {
    return null;
  }

  return (
    <BaseNode classNames="group-node" nodeId={nodeData.groupId || "group-node"}>
      <NodeLabel
        title={nodeData.name || "Group Node"}
        nodeId={nodeData.groupId || "group-node"}
        icon={<IconFolder size={16} />}
      />

      <Handle type="target" position={Position.Left} />

      <Stack spacing="xs" p="sm">
        <Group position="apart" align="center">
          <Button
            size="xs"
            variant="subtle"
            color="red"
            leftIcon={<IconUnlink size={14} />}
            onClick={() => ungroup(data.id)}
          >
            Ungroup
          </Button>
          <Button
            size="xs"
            variant="subtle"
            onClick={() => setIsCollapsed(!isCollapsed)}
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

        {nodeData.description && (
          <Text size="xs" color="dimmed">
            {nodeData.description}
          </Text>
        )}

        {!isCollapsed && (
          <>
            <Divider />
            <Text size="sm" weight={500}>
              Contained Nodes:
            </Text>
            {nodeData.nodes?.map((node) => (
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

      <Handle type="source" position={Position.Right} />
    </BaseNode>
  );
}
