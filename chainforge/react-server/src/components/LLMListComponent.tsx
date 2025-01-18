import React from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { LLMSpec } from "../backend/typing";

interface LLMItemProps {
  llm: LLMSpec;
  index: number;
}

const LLMItem: React.FC<LLMItemProps> = ({ llm, index }) => (
  <Draggable draggableId={llm.id} index={index}>
    {(provided) => (
      <div ref={provided.innerRef} {...provided.draggableProps}>
        {/* Add a drag handle element */}
        <div {...provided.dragHandleProps} className="drag-handle">
          ⋮⋮ {/* Drag handle icon */}
        </div>
        {/* Rest of your LLM item content */}
        <div className="llm-content">
          {/* Your existing LLM item content */}
        </div>
      </div>
    )}
  </Draggable>
);

interface LLMListProps {
  llms: LLMSpec[];
  onDragEnd: (result: any) => void; // Define proper type for result
}

const LLMList: React.FC<LLMListProps> = ({ llms, onDragEnd }) => (
  <DragDropContext onDragEnd={onDragEnd}>
    <Droppable droppableId="llm-list">
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          {llms.map((llm: LLMSpec, index: number) => (
            <LLMItem key={llm.id} llm={llm} index={index} />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </DragDropContext>
);

export default LLMList;
