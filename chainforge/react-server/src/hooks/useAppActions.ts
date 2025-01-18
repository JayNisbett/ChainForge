import { useCallback, useContext } from "react";
import { useClipboard } from "@mantine/hooks";
import { AlertContext } from "../components/AlertProvider";
import { ReactFlowInstance, Node } from "reactflow";
import useStore from "../store/store";
import { FlowService } from "../services/FlowService";
import StorageCache from "../backend/cache";
import { APP_IS_RUNNING_LOCALLY } from "../backend/utils";
import LZString from "lz-string";
import { exportCache } from "../backend/backend";

interface AppActionsState {
  nodes: Node[];
  rfInstance: ReactFlowInstance | null;
}

export const useAppActions = () => {
  const clipboard = useClipboard();
  const showAlert = useContext(AlertContext);
  const rfInstance = useStore((state) => state.rfInstance);
  const nodes = useStore((state) => state.nodes);

  const handleError = useCallback(
    (err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "An unknown error occurred";
      if (showAlert) showAlert(msg);
      console.error(msg);
    },
    [showAlert],
  );

  const onClickShareFlow = useCallback(async () => {
    if (APP_IS_RUNNING_LOCALLY()) {
      handleError(
        new Error(
          "Cannot upload flow to server database when running locally: Feature only exists on hosted version of ChainForge.",
        ),
      );
      return;
    }

    // Helper function
    function isFileSizeLessThan5MB(json_str: string) {
      const encoder = new TextEncoder();
      const encodedString = encoder.encode(json_str);
      const fileSizeInBytes = encodedString.length;
      const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
      return fileSizeInMB < 5;
    }

    // Package up the current flow
    const flow = rfInstance?.toObject();
    const all_node_ids = nodes.map((n: Node) => n.id);
    const cforge_data = await exportCache(all_node_ids)
      .then((cacheData) => ({
        flow,
        cache: cacheData,
      }))
      .catch(handleError);

    if (!cforge_data) return;

    // Compress and validate size
    const compressed = LZString.compressToUTF16(JSON.stringify(cforge_data));
    if (!isFileSizeLessThan5MB(compressed)) {
      handleError(
        new Error(
          "Flow filesize exceeds 5MB. You can only share flows up to 5MB or less. But, don't despair! You can still use 'Export Flow' to share your flow manually as a .cforge file.",
        ),
      );
      return;
    }

    // Upload to server
    try {
      const response = await fetch("/db/shareflow.php", {
        method: "POST",
        body: compressed,
      });
      const uid = await response.text();

      if (!uid || uid.startsWith("Error")) {
        throw new Error(uid || "Received no response from server.");
      }

      // Generate shareable URL
      const base_url = new URL(
        window.location.origin + window.location.pathname,
      );
      const get_params = new URLSearchParams(base_url.search);
      get_params.set("f", uid);
      base_url.search = get_params.toString();
      const get_url = base_url.toString();

      // Copy to clipboard
      clipboard.copy(get_url);
    } catch (err) {
      handleError(err);
    }
  }, [rfInstance, nodes, handleError, clipboard]);

  return {
    handleError,
    onClickShareFlow,
  };
};
