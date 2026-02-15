import React from "react";
import { useNotificationStore } from "../store/notificationStore.js";
import NotificationToast from "./NotificationToast.jsx";

const CONTAINER_STYLE = {
  position: "fixed",
  bottom: 24,
  right: 24,
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  pointerEvents: "none",
};

const WRAPPER_STYLE = {
  pointerEvents: "auto",
};

export default function ToastContainer() {
  const toasts = useNotificationStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div style={CONTAINER_STYLE}>
      {toasts.map((toast) => (
        <div key={toast.id} style={WRAPPER_STYLE}>
          <NotificationToast toast={toast} />
        </div>
      ))}
    </div>
  );
}
