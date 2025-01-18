import React, { createContext, useCallback, useState } from "react";
import { Modal, Text } from "@mantine/core";

export const AlertContext = createContext<((message: string) => void) | null>(
  null,
);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const showAlert = useCallback((msg: string) => {
    setMessage(msg);
    setIsOpen(true);
  }, []);

  return (
    <AlertContext.Provider value={showAlert}>
      {children}
      <Modal
        opened={isOpen}
        onClose={() => setIsOpen(false)}
        title="Alert"
        size="sm"
      >
        <Text>{message}</Text>
      </Modal>
    </AlertContext.Provider>
  );
}
