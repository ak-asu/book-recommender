import { useState, useRef, useEffect, createContext } from "react";

export type ToastVariant =
  | "default"
  | "destructive"
  | "success"
  | "warning"
  | "info";
export type ToastPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "bottom-center";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  position?: ToastPosition;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined,
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      toastTimeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      toastTimeoutsRef.current.clear();
    };
  }, []);

  const toast = ({
    title,
    description,
    variant = "default",
    duration = 5000,
    position = "bottom-right",
  }: Omit<Toast, "id">): string => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, title, description, variant, duration, position };

    setToasts((prev) => [...prev, newToast]);

    if (duration !== Infinity) {
      const timeout = setTimeout(() => {
        dismiss(id);
      }, duration);

      toastTimeoutsRef.current.set(id, timeout);
    }

    return id;
  };

  const dismiss = (id: string) => {
    // Clear the timeout if it exists
    if (toastTimeoutsRef.current.has(id)) {
      clearTimeout(toastTimeoutsRef.current.get(id));
      toastTimeoutsRef.current.delete(id);
    }

    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const dismissAll = () => {
    // Clear all timeouts
    toastTimeoutsRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    toastTimeoutsRef.current.clear();

    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
      {children}
    </ToastContext.Provider>
  );
}
