import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "../store/notificationStore.js";

const AUTO_DISMISS_MS = 10000;

export default function NotificationToast({ toast }) {
  const removeToast = useNotificationStore((s) => s.removeToast);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => removeToast(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [toast.id, removeToast]);

  const message =
    toast.type === "task_assigned"
      ? `${toast.fromUserName || "Someone"} assigned you to "${toast.taskTitle || "a task"}"${toast.boardName ? ` on board "${toast.boardName}"` : ""}.`
      : toast.message;

  const goToBoard = () => {
    if (toast.boardId) navigate(`/board/${toast.boardId}`);
    removeToast(toast.id);
  };

  return (
    <div style={styles.toast}>
      <span style={styles.message}>{message}</span>
      {toast.boardId && (
        <button type="button" onClick={goToBoard} style={styles.link}>
          View board
        </button>
      )}
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        style={styles.close}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

const styles = {
  toast: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.6rem 0.75rem",
    background: "#16213e",
    color: "#fff",
    borderRadius: 8,
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    fontSize: "0.9rem",
    maxWidth: 360,
  },
  message: {
    flex: 1,
  },
  link: {
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
    border: "none",
    padding: "0.25rem 0.5rem",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  close: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.8)",
    cursor: "pointer",
    fontSize: "1.2rem",
    lineHeight: 1,
    padding: "0 0.2rem",
  },
};
