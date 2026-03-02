import React from "react";
import { useSnackbar, VariantType, closeSnackbar } from "notistack";
import { X } from "lucide-react";

type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationOptions {
  message: string;
  type?: NotificationType;
  autoHideDuration?: number;
}

export function useNotification() {
  const { enqueueSnackbar } = useSnackbar();

  const notify = (options: NotificationOptions) => {
    const { message, type = "info", autoHideDuration = 4000 } = options;

    const variantMap: Record<NotificationType, VariantType> = {
      success: "success",
      error: "error",
      warning: "warning",
      info: "info",
    };

    // Paleta de colores SIPARK predefinida
    const styleMap: Record<NotificationType, React.CSSProperties> = {
      success: {
        backgroundColor: "#10b981",
        color: "#ffffff",
        borderLeft: "4px solid #059669",
      },
      error: {
        backgroundColor: "#f43f5e",
        color: "#ffffff",
        borderLeft: "4px solid #e11d48",
      },
      warning: {
        backgroundColor: "#f59e0b",
        color: "#ffffff",
        borderLeft: "4px solid #d97706",
      },
      info: {
        backgroundColor: "#2563eb",
        color: "#ffffff",
        borderLeft: "4px solid #1d4ed8",
      },
    };

    enqueueSnackbar(message, {
      variant: variantMap[type],
      autoHideDuration,
      style: {
        fontFamily: "Inter, sans-serif",
        fontWeight: 500,
        fontSize: "14px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        padding: "12px 16px",
        minWidth: "300px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        ...styleMap[type],
      },
      action: (key) =>
        React.createElement(
          "button",
          {
            onClick: () => closeSnackbar(key),
            style: {
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              color: "white",
              marginLeft: "12px",
            },
          },
          React.createElement(X, { size: 18 }),
        ),
    });
  };

  const success = (message: string, duration?: number) => {
    notify({ message, type: "success", autoHideDuration: duration });
  };

  const error = (message: string, duration?: number) => {
    notify({ message, type: "error", autoHideDuration: duration });
  };

  const warning = (message: string, duration?: number) => {
    notify({ message, type: "warning", autoHideDuration: duration });
  };

  const info = (message: string, duration?: number) => {
    notify({ message, type: "info", autoHideDuration: duration });
  };

  return {
    notify,
    success,
    error,
    warning,
    info,
  };
}
