import React, { useState, useCallback, useEffect } from "react";
import { Handle, Position } from "reactflow";
import { TextInput, Textarea, Select, Box, Button } from "@mantine/core";
import { IconForms } from "@tabler/icons-react";
import BaseNode from "./BaseNode";
import NodeLabel from "./NodeLabelComponent";
import useStore from "../../store/store";
import { Dict } from "../../backend/typing";
import TemplateHooks, {
  extractBracketedSubstrings,
} from "./TemplateHooksComponent";

interface FieldOption {
  label: string;
  value: string;
}

interface Field {
  type: string;
  rules: string;
  value: string;
  title: string;
  placeHolder?: string;
  defaultValue: string;
  key: string;
  options?: FieldOption[];
}

interface DisplayButton {
  name: string;
  value: string;
}

export interface DynamicPromptNodeProps {
  data: {
    _id: string;
    title: string;
    categoryRef: number;
    fields: Field[];
    outputFormat: string;
    displayButton?: DisplayButton[];
    stream?: boolean;
  };
  id: string;
}

const DynamicPromptNode: React.FC<DynamicPromptNodeProps> = ({ data, id }) => {
  const setDataPropsForNode = useStore((state) => state.setDataPropsForNode);
  const pingOutputNodes = useStore((state) => state.pingOutputNodes);

  const [fieldValues, setFieldValues] = useState<Dict<string>>({});
  const [templateVars, setTemplateVars] = useState<string[]>([]);
  const [fieldRefs] = useState<Dict<HTMLDivElement | null>>({});
  const [hooksStartY, setHooksStartY] = useState(0);

  // Initialize field values and extract template variables
  useEffect(() => {
    const initialValues: Dict<string> = {};
    const vars = new Set<string>();

    data.fields.forEach((field) => {
      const value = field.defaultValue || field.value || "";
      initialValues[field.key] = value;

      // Add the field key as a template variable
      vars.add(field.key);

      // Extract any template variables from the value
      const extracted = extractBracketedSubstrings(value);
      extracted.forEach((v) => vars.add(v));
    });

    setFieldValues(initialValues);
    setTemplateVars(Array.from(vars));
  }, [data.fields]);

  // Handle field value changes
  const handleFieldChange = useCallback(
    (key: string, value: string) => {
      setFieldValues((prev) => {
        const newValues = { ...prev, [key]: value };

        // Update template variables
        const vars = new Set<string>();
        Object.entries(newValues).forEach(([k, v]) => {
          vars.add(k);
          const extracted = extractBracketedSubstrings(v);
          extracted.forEach((v) => vars.add(v));
        });
        setTemplateVars(Array.from(vars));

        setDataPropsForNode(id, { fields: newValues });
        pingOutputNodes(id);
        return newValues;
      });
    },
    [id, setDataPropsForNode, pingOutputNodes],
  );

  // Reference for measuring field positions
  const containerRef = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      // Get the container's top position
      const containerTop = node.getBoundingClientRect().top;

      // Calculate startY based on the first field's position
      const firstField = node.querySelector(".field-container");
      if (firstField) {
        const fieldTop = firstField.getBoundingClientRect().top;
        setHooksStartY(fieldTop - containerTop + 10); // Add small offset for alignment
      }
    }
  }, []);

  // Render field based on type
  const renderField = useCallback(
    (field: Field) => {
      const commonProps = {
        key: field.key,
        label: field.title,
        placeholder: field.placeHolder,
        value: fieldValues[field.key] || "",
        required: field.rules === "required",
        className: "nodrag",
      };

      const fieldContent = (() => {
        switch (field.type) {
          case "text":
            return (
              <TextInput
                {...commonProps}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
              />
            );
          case "textArea":
            return (
              <Textarea
                {...commonProps}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                minRows={2}
              />
            );
          case "dropdown":
            return (
              <Select
                {...commonProps}
                onChange={(value) => handleFieldChange(field.key, value || "")}
                data={field.options || []}
              />
            );
          default:
            return null;
        }
      })();

      return (
        <div key={field.key} className="field-container">
          {fieldContent}
        </div>
      );
    },
    [fieldValues, handleFieldChange],
  );

  return (
    <BaseNode classNames="dynamic-prompt-node" nodeId={id}>
      <NodeLabel
        title={data.title}
        nodeId={id}
        icon={<IconForms size="16px" />}
      />

      <Box p="xs" ref={containerRef}>
        {data.fields.map((field) => renderField(field))}

        {data.displayButton && (
          <Box mt="md">
            {data.displayButton.map((button) => (
              <Button
                key={button.value}
                onClick={() => {
                  console.log("Button clicked:", button.value, fieldValues);
                }}
                size="sm"
                className="nodrag"
              >
                {button.name}
              </Button>
            ))}
          </Box>
        )}
      </Box>

      <TemplateHooks
        vars={templateVars}
        nodeId={id}
        startY={hooksStartY}
        position={Position.Left}
      />

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="grouped-handle"
        style={{ top: "50%" }}
      />
    </BaseNode>
  );
};

export default DynamicPromptNode;
