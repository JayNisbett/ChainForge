import { useCallback } from "react";
import { ReactFlowInstance } from "reactflow";
import { browserTabIsActive } from "../backend/utils";

export const useFlowInitialization = (
  saveFlow: (rf_inst: ReactFlowInstance) => void,
) => {
  const initAutosaving = useCallback(
    (rf_inst: ReactFlowInstance) => {
      const interval = setInterval(() => {
        if (!browserTabIsActive()) return;
        const startTime = Date.now();
        saveFlow(rf_inst);
        const duration = Date.now() - startTime;
        if (duration > 1500) {
          console.warn(
            "Autosaving disabled. The time required to save exceeds 1.5 seconds.",
          );
          clearInterval(interval);
        }
      }, 60000);
      return interval;
    },
    [saveFlow],
  );

  const getSharedFlowURLParam = useCallback(() => {
    const curr_url = new URL(window.location.href);
    const params = new URLSearchParams(curr_url.search);
    const shared_flow_uid = params.get("f");
    if (shared_flow_uid) {
      const is_base36 = /^[0-9a-z]+$/i;
      if (shared_flow_uid.length > 1 && is_base36.test(shared_flow_uid))
        return shared_flow_uid;
    }
    return undefined;
  }, []);

  return {
    initAutosaving,
    getSharedFlowURLParam,
  };
};
