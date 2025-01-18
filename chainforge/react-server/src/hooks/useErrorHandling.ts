import { useCallback } from "react";

export const useErrorHandling = (
  setIsLoading: (loading: boolean) => void,
  setWaitingForShare: (waiting: boolean) => void,
  showAlert?: (msg: string) => void,
) => {
  const handleError = useCallback(
    (err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "An unknown error occurred";
      setIsLoading(false);
      setWaitingForShare(false);
      if (showAlert) showAlert(msg);
      console.error(msg);
    },
    [setIsLoading, setWaitingForShare, showAlert],
  );

  return { handleError };
};
