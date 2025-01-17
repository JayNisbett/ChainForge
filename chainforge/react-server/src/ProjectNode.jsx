import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Handle, Position } from "reactflow";
import { Select, Text, Stack, Group } from "@mantine/core";
import { IconFolder } from "@tabler/icons-react";
import useStore from "./store";
import NodeLabel from "./NodeLabelComponent";
import BaseNode from "./BaseNode";

// Define project attribute schema
const PROJECT_ATTRIBUTES = {
  inputs: {
    ProjectName: { type: "string", required: true },
    description: { type: "string", required: false },
    ProjectCategory: { type: "string", required: false },
    ProjectCode: { type: "string", required: false },
    DueDate: { type: "date", required: false },
    status: { type: "string", required: false },
    ProjectType: { type: "string", required: false },
  },
  outputs: {
    _id: { type: "string", description: "Project ID" },
    ProjectName: { type: "string", description: "Project Name" },
    description: { type: "string", description: "Project Description" },
    status: { type: "string", description: "Project Status" },
    DueDate: { type: "date", description: "Due Date" },
    ProjectCategory: { type: "string", description: "Project Category" },
    ProjectCode: { type: "string", description: "Project Code" },
    ProjectType: { type: "string", description: "Project Type" },
  },
};

function ProjectNode({ data = { projects: [], tasks: {} }, id }) {
  console.log("ProjectNode mounted with data:", data);

  const setDataPropsForNode = useStore((state) => state.setDataPropsForNode);
  const pingOutputNodes = useStore((state) => state.pingOutputNodes);
  const projects = useStore((state) => state.projects);
  const [mode, setMode] = useState(data.mode || "select"); // 'select' or 'create'

  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [selectedProject, setSelectedProject] = useState(
    selectedProjectId
      ? projects.find((p) => p._id === selectedProjectId) || null
      : null,
  );

  // Create options for the select component with proper null checks
  const projectOptions = useMemo(() => {
    if (!Array.isArray(projects)) return [];

    return projects
      .filter((project) => project && project._id)
      .map((project) => ({
        value: project._id,
        label: project.ProjectName || "Unnamed Project",
        description: project.description || "",
        group: project.status || "All Projects",
      }));
  }, [projects]);

  // Handle project selection
  const handleProjectSelect = useCallback(
    (projectId) => {
      if (!projectId) {
        setSelectedProject(null);
        return;
      }

      setSelectedProjectId(projectId);

      const project = projects.find((p) => p._id === projectId) || null;
      setSelectedProject(project);

      if (project) {
        // Map all available project attributes
        const projectAttributes = Object.keys(
          PROJECT_ATTRIBUTES.outputs,
        ).reduce((acc, key) => {
          acc[key] = project[key] || "";
          return acc;
        }, {});

        setDataPropsForNode(id, {
          selectedProjectId: project._id,
          projectAttributes,
          mode,
        });
        pingOutputNodes(id);
      }
    },
    [id, projects, setDataPropsForNode, pingOutputNodes, mode],
  );

  // Create input handles for project creation/updating
  const inputHandles = useMemo(() => {
    return Object.entries(PROJECT_ATTRIBUTES.inputs).map(([key, config]) => (
      <div key={`input-${key}`} className="attribute-handle-wrapper">
        <Handle
          type="target"
          position={Position.Left}
          id={`input-${key}`}
          className="attribute-handle"
          style={{ top: "50%" }}
        />
        <Text size="sm" className="attribute-label">
          {key} {config.required && "*"}
        </Text>
      </div>
    ));
  }, []);

  // Create output handles for project attributes
  const outputHandles = useMemo(() => {
    if (!selectedProject && mode === "select") return null;

    return Object.entries(PROJECT_ATTRIBUTES.outputs).map(([key, config]) => (
      <div key={`output-${key}`} className="attribute-handle-wrapper">
        <Text size="sm" className="attribute-label" title={config.description}>
          {key}
        </Text>
        <Handle
          type="source"
          position={Position.Right}
          id={`output-${key}`}
          className="attribute-handle"
          style={{ top: "50%" }}
        />
      </div>
    ));
  }, [selectedProject, mode]);

  // Event handlers for project updates
  useEffect(() => {
    const handleProjectsUpdated = (e) => {
      useStore.getState().setProjects(e.detail.projects);
    };

    window.addEventListener("projectsUpdated", handleProjectsUpdated);
    return () =>
      window.removeEventListener("projectsUpdated", handleProjectsUpdated);
  }, []);

  // Update selected project when needed
  useEffect(() => {
    if (selectedProjectId && !selectedProject) {
      const project = projects.find((p) => p._id === selectedProjectId);
      if (project) setSelectedProject(project);
    }
  }, [selectedProjectId, projects, selectedProject]);

  return (
    <BaseNode classNames="project-node" nodeId={id}>
      <NodeLabel
        title={data.title ?? "Project Node"}
        nodeId={id}
        icon={<IconFolder size="16px" />}
      />
      <div className="project-node-content">
        <Stack spacing="xs">
          <Select
            data={projectOptions}
            value={selectedProject?._id || null}
            onChange={handleProjectSelect}
            placeholder="Select a project"
            searchable
            nothingFound="No projects found"
            maxDropdownHeight={400}
            className="project-select"
            clearable={true}
            styles={(theme) => ({
              item: {
                "&[data-selected]": {
                  "&, &:hover": {
                    backgroundColor: theme.colors.blue[7],
                    color: theme.white,
                  },
                },
              },
              description: {
                fontSize: theme.fontSizes.xs,
                color: theme.colors.gray[6],
              },
            })}
          />

          <Group position="apart" spacing="xs">
            <div className="inputs-container">
              <Text size="sm" weight={500} className="handles-title">
                Inputs
              </Text>
              {inputHandles}
            </div>

            <div className="outputs-container">
              <Text size="sm" weight={500} className="handles-title">
                Outputs
              </Text>
              {outputHandles}
            </div>
          </Group>
        </Stack>
      </div>
    </BaseNode>
  );
}

export default ProjectNode;
