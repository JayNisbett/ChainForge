import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Modal, TextInput, Button, Stack, Tabs, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconLayersSubtract, IconLayersIntersect } from "@tabler/icons-react";
import useStore from "../../store/store";
import { FlowService } from "../../services/FlowService";

export interface GroupModalRef {
  trigger: () => void;
}

interface GroupModalProps {
  onCreateGroup?: (name: string, description?: string) => void;
  onCreateFlow?: (name: string, description?: string) => void;
}

export const GroupModal = forwardRef<GroupModalRef, GroupModalProps>(
  ({ onCreateGroup, onCreateFlow }, ref) => {
    const [opened, { open, close }] = useDisclosure(false);
    const [activeTab, setActiveTab] = useState<"group" | "flow">("group");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const selectedNodes = useStore((state) => state.selectedNodes);
    const nodes = useStore((state) => state.nodes);

    useImperativeHandle(ref, () => ({
      trigger: () => {
        open();
      },
    }));

    const handleSubmit = () => {
      if (activeTab === "group" && onCreateGroup) {
        onCreateGroup(name, description);
      } else if (activeTab === "flow" && onCreateFlow) {
        onCreateFlow(name, description);
      }
      setName("");
      setDescription("");
      close();
    };

    // Get names of selected nodes for preview
    const selectedNodeNames = React.useMemo(() => {
      if (!Array.isArray(nodes)) return "";

      return nodes
        .filter((node) => selectedNodes.includes(node.id))
        .map((node) => node.data.name || node.id)
        .join(", ");
    }, [nodes, selectedNodes]);

    return (
      <Modal
        opened={opened}
        onClose={close}
        title="Create Group or Flow from Selection"
        size="lg"
      >
        <Tabs
          value={activeTab}
          onTabChange={(value: string | null) => {
            if (value === "group" || value === "flow") {
              setActiveTab(value);
            }
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="group" icon={<IconLayersSubtract size={14} />}>
              Create Group
            </Tabs.Tab>
            <Tabs.Tab value="flow" icon={<IconLayersIntersect size={14} />}>
              Save as Flow
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="group" pt="xs">
            <Text size="sm" mb="md">
              Create a collapsible group from the selected nodes. The group will
              remain part of the current flow.
            </Text>
          </Tabs.Panel>

          <Tabs.Panel value="flow" pt="xs">
            <Text size="sm" mb="md">
              Save the selected nodes as a new flow that can be reused across
              different flows.
            </Text>
          </Tabs.Panel>
        </Tabs>

        <Stack mt="md">
          <Text size="sm" color="dimmed">
            Selected nodes: {selectedNodeNames}
          </Text>

          <TextInput
            label="Name"
            placeholder={
              activeTab === "group" ? "Enter group name" : "Enter flow name"
            }
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
          />

          <TextInput
            label="Description"
            placeholder="Enter description (optional)"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />

          <Button
            onClick={handleSubmit}
            disabled={!name || selectedNodes.length < 2}
          >
            {activeTab === "group" ? "Create Group" : "Save as Flow"}
          </Button>
        </Stack>
      </Modal>
    );
  },
);

GroupModal.displayName = "GroupModal";
