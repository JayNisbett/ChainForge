import { useState, useCallback } from "react";
import { ReactFlowInstance } from "reactflow";
import { browserTabIsActive } from "../backend/utils";

type SaveFlowFunction = (rf_inst: ReactFlowInstance) => void;

export const useAutosaving = (saveFlow: SaveFlowFunction) => {
  const [autosavingInterval, setAutosavingInterval] = useState<
    NodeJS.Timeout | undefined
  >(undefined);

  const initAutosaving = useCallback(
    (rf_inst: ReactFlowInstance) => {
      if (autosavingInterval !== undefined) return;
      console.log("Init autosaving");

      const interv = setInterval(() => {
        if (!browserTabIsActive()) return;

        const startTime = Date.now();
        saveFlow(rf_inst);
        const duration = Date.now() - startTime;

        if (duration > 1500) {
          console.warn(
            "Autosaving disabled. The time required to save exceeds 1.5 seconds.",
          );
          clearInterval(interv);
          setAutosavingInterval(undefined);
        }
      }, 60000);

      setAutosavingInterval(interv);
    },
    [saveFlow, autosavingInterval],
  );

  return {
    autosavingInterval,
    setAutosavingInterval,
    initAutosaving,
  };
};
