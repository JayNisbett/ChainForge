import React, { useState } from "react";
import { Menu, Button, Modal, TextInput, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconDownload, IconTrash } from "@tabler/icons-react";
import { FlowService } from "../services/FlowService";
import { Flow } from "../types/flow";
import { Dict } from "../types/common";

interface FlowManagerProps {
  currentFlow: Flow | null;
  onCreateFlow: (name: string, description?: string) => void;
  onLoadFlow: (flowId: string) => void;
  onCreateSnapshot: (name?: string, description?: string) => void;
  onRestoreSnapshot: (snapshotId: string) => void;
}

export function FlowManager({
  currentFlow,
  onCreateFlow,
  onLoadFlow,
  onCreateSnapshot,
  onRestoreSnapshot,
}: FlowManagerProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDescription, setNewFlowDescription] = useState("");

  const flows = FlowService.getFlows();
  const snapshots = currentFlow
    ? FlowService.getSnapshots().filter((s) => s.flowId === currentFlow.id)
    : [];

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
          <Menu.Label>Flows</Menu.Label>
          {flows.map((flow) => (
            <Menu.Item
              key={flow.id}
              onClick={() => onLoadFlow(flow.id)}
              rightSection={
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {flow.isDefault ? (
                    <Text size="xs">Default</Text>
                  ) : (
                    <IconTrash
                      size={14}
                      color="red"
                      style={{ cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm(
                            `Are you sure you want to delete "${flow.name}"?`,
                          )
                        ) {
                          FlowService.deleteFlow(flow.id);
                          if (currentFlow?.id === flow.id) {
                            const remainingFlows = FlowService.getFlows();
                            if (remainingFlows.length > 0) {
                              onLoadFlow(remainingFlows[0].id);
                            }
                          }
                        }
                      }}
                    />
                  )}
                </div>
              }
            >
              {flow.name}
            </Menu.Item>
          ))}

          <Menu.Divider />

          <Menu.Label>Actions</Menu.Label>
          <Menu.Item icon={<IconPlus size={14} />} onClick={open}>
            New Flow
          </Menu.Item>
          {currentFlow && (
            <Menu.Item
              icon={<IconDownload size={14} />}
              onClick={() => onCreateSnapshot()}
            >
              Create Snapshot
            </Menu.Item>
          )}

          {snapshots.length > 0 && (
            <>
              <Menu.Label>Snapshots</Menu.Label>
              {snapshots.map((snapshot) => (
                <Menu.Item
                  key={snapshot.id}
                  onClick={() => onRestoreSnapshot(snapshot.id)}
                  title={snapshot.description || "No description"}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>
                      {snapshot.name || `Version ${snapshot.version}`}
                    </span>
                    <Text size="xs" color="dimmed">
                      {new Date(snapshot.createdAt).toLocaleString()}
                    </Text>
                  </div>
                </Menu.Item>
              ))}
            </>
          )}
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
          onClick={() => {
            onCreateFlow(newFlowName, newFlowDescription);
            close();
            setNewFlowName("");
            setNewFlowDescription("");
          }}
          mt="md"
          size="sm"
          variant="gradient"
          compact
          disabled={!newFlowName}
        >
          Create Flow
        </Button>
      </Modal>
    </>
  );
}
