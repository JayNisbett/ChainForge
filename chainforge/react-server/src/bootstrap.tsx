import React from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { AlertProvider } from "./components/AlertProvider";
import App from "./App";

interface MountOptions {
  initialPath?: string;
  initialData?: {
    projects?: any[];
    tasks?: any[];
  };
  onNavigate?: (
    args: { pathname: string } | { type: string; data: any },
  ) => void;
}

const mount = async (
  el: HTMLElement,
  { initialPath = "", initialData, onNavigate }: MountOptions = {},
) => {
  console.log("Bootstrap mount called with:", { initialPath, initialData });

  const root = createRoot(el);

  root.render(
    <React.StrictMode>
      <MantineProvider>
        <AlertProvider>
          <App initialData={initialData} />
        </AlertProvider>
      </MantineProvider>
    </React.StrictMode>,
  );

  return {
    onParentNavigate: ({ type, data }: { type: string; data: any }) => {
      console.log("Parent navigation:", { type, data });
      if (onNavigate) {
        onNavigate({ type, data });
      }
    },
  };
};

// For local development and testing
if (process.env.NODE_ENV === "development") {
  const devRoot = document.getElementById("root");
  if (devRoot) {
    mount(devRoot, { initialPath: "/" });
  }
}

export default mount;
