import React from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// In your LLM item component
const LLMItem = ({ llm, index }) => (
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

// In your LLM list component
const LLMList = ({ llms }) => (
  <DragDropContext onDragEnd={handleDragEnd}>
    <Droppable droppableId="llm-list">
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          {llms.map((llm, index) => (
            <LLMItem key={llm.id} llm={llm} index={index} />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </DragDropContext>
);
