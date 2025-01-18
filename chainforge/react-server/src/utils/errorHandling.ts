import { AlertContext } from "../components/AlertProvider";

export const handleError = (
  err: unknown,
  showAlert?: (msg: string) => void,
) => {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "An unknown error occurred";
  if (showAlert) showAlert(msg);
  console.error(msg);
};
