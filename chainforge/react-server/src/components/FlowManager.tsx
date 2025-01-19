import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Menu,
  Button,
  Modal,
  TextInput,
  Text,
  Badge,
  Group,
  ActionIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconDownload, IconTrash } from "@tabler/icons-react";
import { FlowService } from "../services/FlowService";
import { useFlowManagement } from "../hooks/useFlowManagement";
import { Flow } from "../types/flow";

export function FlowManager() {
  const {
    currentFlow,
    loadFlow,
    createFlow,
    deleteFlow,
    createSnapshot,
    restoreSnapshot,
  } = useFlowManagement();

  // Only keep UI-specific state here
  const [opened, { open, close }] = useDisclosure(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDescription, setNewFlowDescription] = useState("");
  const [forceUpdate, setForceUpdate] = useState(false);

  // Initialize default flows on mount
  useEffect(() => {
    FlowService.initializeDefaultFlows();
  }, []);

  const flows = useMemo(() => {
    const allFlows = FlowService.getFlows();
    return allFlows.sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [forceUpdate]);

  const handleCreateFlow = useCallback(
    (name: string, description?: string) => {
      createFlow(name, description);
      close();
      setNewFlowName("");
      setNewFlowDescription("");
    },
    [createFlow, close],
  );

  const handleDeleteFlow = useCallback(
    (flowId: string) => {
      try {
        deleteFlow(flowId);
        setForceUpdate((prev) => !prev);
      } catch (err) {
        console.error("Failed to delete flow:", err);
      }
    },
    [deleteFlow],
  );

  return (
    <>
      <Menu>
        <Menu.Target>
          <Button
            leftIcon={<IconPlus size={14} />}
            size="sm"
            variant="gradient"
            compact
            mr="sm"
          >
            {currentFlow?.name || "Select Flow"}
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Default Flows</Menu.Label>
          {flows
            .filter((f) => f.isDefault)
            .map((flow) => (
              <Menu.Item
                key={flow.id}
                onClick={() => loadFlow(flow.id)}
                rightSection={<Badge>Default</Badge>}
              >
                {flow.name}
              </Menu.Item>
            ))}

          <Menu.Divider />
          <Menu.Label>My Flows</Menu.Label>
          {flows
            .filter((f) => !f.isDefault)
            .filter((f) => f?.data?.nodes?.length > 0)
            .map((flow) => (
              <Menu.Item key={flow.id} onClick={() => loadFlow(flow.id)}>
                <Group position="apart">
                  <Text>{flow.name}</Text>
                  <ActionIcon
                    color="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFlow(flow.id);
                    }}
                    disabled={flow.isDefault}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Menu.Item>
            ))}
        </Menu.Dropdown>
      </Menu>

      <Modal opened={opened} onClose={close} title="Create New Flow">
        <TextInput
          label="Flow Name"
          placeholder="Enter flow name"
          value={newFlowName}
          onChange={(e) => setNewFlowName(e.currentTarget.value)}
          required
        />
        <TextInput
          label="Description"
          placeholder="Enter flow description"
          value={newFlowDescription}
          onChange={(e) => setNewFlowDescription(e.currentTarget.value)}
          mt="md"
        />
        <Button
          onClick={() => handleCreateFlow(newFlowName, newFlowDescription)}
          mt="md"
          disabled={!newFlowName}
        >
          Create Flow
        </Button>
      </Modal>
    </>
  );
}
