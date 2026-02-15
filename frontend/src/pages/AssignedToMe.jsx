import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import * as tasksApi from "../api/tasks.js";

const PAGE_SIZE = 20;

export default function AssignedToMe() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    tasksApi
      .getTasksAssignedToMe({ page: 1, limit: PAGE_SIZE })
      .then((res) => {
        if (!cancelled) {
          setTasks(res.tasks);
          setTotal(res.total);
          setPage(res.page);
          setTotalPages(res.totalPages);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load tasks");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  function loadMore() {
    if (page >= totalPages) return;
    setLoading(true);
    tasksApi
      .getTasksAssignedToMe({ page: page + 1, limit: PAGE_SIZE })
      .then((res) => {
        setTasks((prev) => [...prev, ...res.tasks]);
        setPage(res.page);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Link to="/" style={styles.backLink}>
            ← Boards
          </Link>
          <h1 style={styles.title}>Assigned to me</h1>
        </div>
        <div style={styles.userRow}>
          <span style={styles.userName}>{user?.name || user?.email}</span>
          <button type="button" onClick={handleLogout} style={styles.logoutBtn}>
            Log out
          </button>
        </div>
      </header>
      <main style={styles.main}>
        {error && (
          <div style={styles.error}>
            {error}
            <button type="button" onClick={() => setError(null)} style={styles.dismissBtn}>
              Dismiss
            </button>
          </div>
        )}
        {loading && tasks.length === 0 ? (
          <p style={styles.muted}>Loading tasks…</p>
        ) : tasks.length === 0 ? (
          <p style={styles.muted}>No tasks have been assigned to you yet.</p>
        ) : (
          <>
            <p style={styles.summary}>
              {total} task{total !== 1 ? "s" : ""} assigned to you
            </p>
            <ul style={styles.taskList}>
              {tasks.map((task) => (
                <li key={task.id} style={styles.taskCard}>
                  <div style={styles.taskBody}>
                    <span style={styles.taskTitle}>{task.title}</span>
                    {task.description ? (
                      <p style={styles.taskDesc}>{task.description}</p>
                    ) : null}
                    <div style={styles.meta}>
                      <span style={styles.metaItem}>
                        Board: {task.boardName || "—"}
                      </span>
                      <span style={styles.metaItem}>
                        List: {task.listTitle || "—"}
                      </span>
                    </div>
                  </div>
                  {task.boardId && (
                    <Link
                      to={`/board/${task.boardId}`}
                      style={styles.openBtn}
                    >
                      Open board
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            {page < totalPages && (
              <div style={styles.loadMoreWrap}>
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loading}
                  style={styles.loadMoreBtn}
                >
                  {loading ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
    background: "#f0f2f5",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 2rem",
    background: "#16213e",
    color: "#fff",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  backLink: {
    color: "rgba(255,255,255,0.9)",
    textDecoration: "none",
    fontSize: "0.875rem",
  },
  title: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: 700,
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  userName: {
    fontSize: "0.875rem",
    opacity: 0.9,
  },
  logoutBtn: {
    padding: "0.4rem 0.75rem",
    background: "transparent",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.5)",
    borderRadius: 6,
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  main: {
    padding: "2rem",
    maxWidth: 700,
    margin: "0 auto",
  },
  error: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1rem",
    padding: "0.75rem 1rem",
    background: "#fee",
    color: "#c00",
    borderRadius: 8,
    fontSize: "0.875rem",
  },
  dismissBtn: {
    marginLeft: "0.5rem",
    padding: "0.25rem 0.5rem",
    background: "transparent",
    border: "1px solid #c00",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "0.75rem",
  },
  summary: {
    color: "#666",
    fontSize: "0.875rem",
    marginBottom: "1rem",
  },
  taskList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  taskCard: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "1rem",
    padding: "1rem 1.25rem",
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  taskBody: {
    flex: 1,
    minWidth: 0,
  },
  taskTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#1a1a2e",
  },
  taskDesc: {
    margin: "0.35rem 0 0",
    fontSize: "0.875rem",
    color: "#555",
    lineHeight: 1.4,
  },
  meta: {
    marginTop: "0.5rem",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem 1rem",
    fontSize: "0.8rem",
    color: "#666",
  },
  metaItem: {
    flexShrink: 0,
  },
  openBtn: {
    flexShrink: 0,
    padding: "0.4rem 0.75rem",
    background: "#16213e",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: "0.8rem",
    textDecoration: "none",
    cursor: "pointer",
  },
  loadMoreWrap: {
    marginTop: "1.5rem",
    display: "flex",
    justifyContent: "center",
  },
  loadMoreBtn: {
    padding: "0.5rem 1rem",
    background: "#16213e",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  muted: {
    color: "#666",
    fontSize: "0.875rem",
  },
};
