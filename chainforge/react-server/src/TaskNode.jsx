import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Handle, Position } from "reactflow";
import { Select, Text } from "@mantine/core";
import { IconFolder } from "@tabler/icons-react";
import useStore from "./store";
import NodeLabel from "./NodeLabelComponent";
import BaseNode from "./BaseNode";

function ProjectNode({ data, id }) {
  console.log("ProjectNode mounted with data:", data);

  const setDataPropsForNode = useStore((state) => state.setDataPropsForNode);
  const pingOutputNodes = useStore((state) => state.pingOutputNodes);
  const projects = useStore((state) => state.projects);

  useEffect(() => {
    console.log("Available projects:", projects);
  }, [projects]);

  const [selectedProject, setSelectedProject] = useState(
    data.selectedProjectId
      ? projects.find((p) => p._id === data.selectedProjectId) || null
      : null,
  );

  // Create options for the select component
  const projectOptions = useMemo(() => {
    return projects.map((project) => ({
      value: project._id,
      label: project.name,
      description: project.description || undefined,
      group: project.status || "All Projects",
    }));
  }, [projects]);

  // Handle project selection
  const handleProjectSelect = useCallback(
    (projectId) => {
      if (!projectId) {
        console.log("Project selection cleared");
        setSelectedProject(null);
        return;
      }

      const project = projects.find((p) => p._id === projectId) || null;
      console.log("Project selected:", {
        projectId,
        foundProject: project,
        allProjects: projects,
      });

      setSelectedProject(project);

      if (project) {
        const projectAttributes = {
          id: project._id,
          name: project.name,
          description: project.description || "",
          status: project.status || "",
          startDate: project.startDate || "",
          endDate: project.endDate || "",
        };

        setDataPropsForNode(id, {
          selectedProjectId: project._id,
          projectAttributes,
        });
        pingOutputNodes(id);
      }
    },
    [id, projects, setDataPropsForNode, pingOutputNodes],
  );

  // Create attribute handles for connecting to other nodes
  const attributeHandles = useMemo(() => {
    if (!selectedProject) return null;

    const attributes = data.projectAttributes || {};
    return Object.entries(attributes).map(([key]) => (
      <div key={key} className="attribute-handle-wrapper">
        <Text size="sm" className="attribute-label">
          {key}
        </Text>
        <Handle
          type="source"
          position={Position.Right}
          id={`attribute-${key}`}
          className="attribute-handle"
          style={{ top: "50%" }}
        />
      </div>
    ));
  }, [selectedProject, data.projectAttributes]);

  // Debugging for projects state
  useEffect(() => {
    console.log("Projects in ProjectNode:", projects);
  }, [projects]);

  // Debugging for project options
  useEffect(() => {
    console.log("Project options:", projectOptions);
  }, [projectOptions]);

  // Debugging for selected project
  useEffect(() => {
    console.log("Selected project:", selectedProject);
  }, [selectedProject]);

  // Update the project update handler with more detailed logging
  useEffect(() => {
    const handleProjectsUpdated = (e) => {
      console.log("ProjectNode received projectsUpdated event");
      console.log("Event detail:", e.detail);
      console.log("Current projects before update:", projects);
      useStore.getState().setProjects(e.detail.projects);
    };

    window.addEventListener("projectsUpdated", handleProjectsUpdated);

    return () => {
      window.removeEventListener("projectsUpdated", handleProjectsUpdated);
    };
  }, [projects]);

  useEffect(() => {
    if (data.selectedProjectId && !selectedProject) {
      const project = projects.find((p) => p._id === data.selectedProjectId);
      if (project) {
        setSelectedProject(project);
      }
    }
  }, [data.selectedProjectId, projects, selectedProject]);

  useEffect(() => {
    console.log("ProjectNode mounted/updated with:", {
      availableProjects: projects,
      currentSelection: selectedProject,
      nodeData: data,
    });
  }, [projects, selectedProject, data]);

  return (
    <BaseNode classNames="project-node" nodeId={id}>
      <NodeLabel
        title={data.title ?? "Project Node"}
        nodeId={id}
        icon={<IconFolder size="16px" />}
      />
      <div className="project-node-content">
        <Select
          data={projectOptions}
          value={selectedProject?._id || null}
          onChange={handleProjectSelect}
          placeholder="Select a project"
          searchable
          nothingFound="No projects found"
          maxDropdownHeight={400}
          className="project-select"
          clearable={false}
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
        {selectedProject && (
          <div className="attributes-container">
            <Text size="sm" weight={500} className="attributes-title">
              Project Attributes
            </Text>
            {attributeHandles}
          </div>
        )}
      </div>
    </BaseNode>
  );
}

export default ProjectNode;
