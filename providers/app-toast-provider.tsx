import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { AppToast } from "@/components/ui/app-toast";

type ToastPosition = "top" | "bottom";

type AppToastContextValue = {
  showToast: (message: string, position?: ToastPosition) => void;
};

const AppToastContext = createContext<AppToastContextValue | undefined>(
  undefined,
);

export function AppToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<ToastPosition>("top");

  const showToast = useCallback(
    (nextMessage: string, nextPosition: ToastPosition = "top") => {
      if (!nextMessage.trim()) return;
      setPosition(nextPosition);
      setMessage(nextMessage);
      setVisible(true);
    },
    [],
  );

  const value = useMemo<AppToastContextValue>(
    () => ({ showToast }),
    [showToast],
  );

  return (
    <AppToastContext.Provider value={value}>
      {children}
      <AppToast
        message={message}
        visible={visible}
        position={position}
        topOffset={72}
        bottomOffset={30}
        onHide={() => {
          setVisible(false);
          setMessage(null);
        }}
      />
    </AppToastContext.Provider>
  );
}

export function useAppToast() {
  const context = useContext(AppToastContext);
  if (!context) {
    throw new Error("useAppToast must be used within AppToastProvider.");
  }

  return context;
}
