import React, { useEffect } from "react";
import { useBoardStore } from "../store/boardStore.js";

const ACTION_LABELS = {
  task_created: "created a task",
  task_updated: "updated a task",
  task_deleted: "deleted a task",
  task_moved: "moved a task",
};

function formatTime(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now - d) / 60000;
    if (diff < 1) return "just now";
    if (diff < 60) return `${Math.floor(diff)}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString();
  } catch (_) {
    return "";
  }
}

export default function ActivityPanel({ boardId, isOpen, onClose }) {
  const activities = useBoardStore((s) => s.activities);
  const activityPage = useBoardStore((s) => s.activityPage);
  const activityTotalPages = useBoardStore((s) => s.activityTotalPages);
  const activitiesLoading = useBoardStore((s) => s.activitiesLoading);
  const fetchActivity = useBoardStore((s) => s.fetchActivity);
  const loadMoreActivity = useBoardStore((s) => s.loadMoreActivity);

  useEffect(() => {
    if (boardId && isOpen) {
      fetchActivity(boardId);
    }
  }, [boardId, isOpen, fetchActivity]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>Activity</h3>
          <button type="button" onClick={onClose} style={styles.closeBtn}>
            ×
          </button>
        </div>
        <div style={styles.list}>
          {activitiesLoading && activities.length === 0 ? (
            <p style={styles.muted}>Loading…</p>
          ) : activities.length === 0 ? (
            <p style={styles.muted}>No activity yet.</p>
          ) : (
            activities.map((a) => (
              <div key={a.id} style={styles.item}>
                <span style={styles.user}>{a.userName}</span>{" "}
                <span style={styles.action}>{ACTION_LABELS[a.action] ?? a.action}</span>
                <span style={styles.time}>{formatTime(a.timestamp)}</span>
              </div>
            ))
          )}
        </div>
        {activityTotalPages > 1 && activityPage < activityTotalPages && (
          <button
            type="button"
            onClick={() => loadMoreActivity(boardId)}
            disabled={activitiesLoading}
            style={styles.loadMore}
          >
            {activitiesLoading ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.3)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  panel: {
    width: "100%",
    maxWidth: 360,
    height: "100%",
    background: "#fff",
    boxShadow: "-4px 0 20px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 1.25rem",
    borderBottom: "1px solid #eee",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 700,
    color: "#16213e",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#666",
    lineHeight: 1,
    padding: "0 0.25rem",
  },
  list: {
    flex: 1,
    overflow: "auto",
    padding: "0.75rem 1.25rem",
  },
  item: {
    padding: "0.5rem 0",
    borderBottom: "1px solid #f0f0f0",
    fontSize: "0.875rem",
  },
  user: {
    fontWeight: 600,
    color: "#16213e",
  },
  action: {
    color: "#555",
  },
  time: {
    display: "block",
    fontSize: "0.75rem",
    color: "#888",
    marginTop: "0.2rem",
  },
  muted: {
    color: "#888",
    fontSize: "0.875rem",
  },
  loadMore: {
    margin: "0.75rem 1.25rem",
    padding: "0.5rem",
    background: "#e8e9ec",
    border: "none",
    borderRadius: 6,
    fontSize: "0.875rem",
    cursor: "pointer",
  },
};
