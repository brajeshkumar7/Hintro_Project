import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import { useBoardStore } from "../store/boardStore.js";

export default function Home() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const boards = useBoardStore((s) => s.boards);
  const fetchBoards = useBoardStore((s) => s.fetchBoards);
  const createBoard = useBoardStore((s) => s.createBoard);
  const loading = useBoardStore((s) => s.loading);
  const error = useBoardStore((s) => s.error);
  const clearError = useBoardStore((s) => s.clearError);
  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBoards().catch(() => {});
  }, [fetchBoards]);

  async function handleCreateBoard(e) {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    setCreating(true);
    clearError();
    try {
      const board = await createBoard(newBoardName.trim());
      setNewBoardName("");
      navigate(`/board/${board.id}`);
    } catch (_) {}
    setCreating(false);
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Boards</h1>
        <div style={styles.navRow}>
          <Link to="/my-tasks" style={styles.myTasksLink}>
            Assigned to me
          </Link>
          <div style={styles.userRow}>
          <span style={styles.userName}>{user?.name || user?.email}</span>
          <button type="button" onClick={handleLogout} style={styles.logoutBtn}>
            Log out
          </button>
          </div>
        </div>
      </header>
      <main style={styles.main}>
        {error && (
          <div style={styles.error}>
            {error}
            <button type="button" onClick={clearError} style={styles.dismissBtn}>
              Dismiss
            </button>
          </div>
        )}
        <form onSubmit={handleCreateBoard} style={styles.createForm}>
          <input
            type="text"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="New board name"
            style={styles.input}
            disabled={creating}
          />
          <button type="submit" disabled={creating || !newBoardName.trim()} style={styles.primaryBtn}>
            {creating ? "Creating…" : "Create board"}
          </button>
        </form>
        {loading ? (
          <p style={styles.muted}>Loading boards…</p>
        ) : boards.length === 0 ? (
          <p style={styles.muted}>No boards yet. Create one above.</p>
        ) : (
          <ul style={styles.boardList}>
            {boards.map((b) => (
              <li key={b.id}>
                <Link to={`/board/${b.id}`} style={styles.boardCard}>
                  <span style={styles.boardName}>{b.name}</span>
                </Link>
              </li>
            ))}
          </ul>
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
  title: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: 700,
  },
  navRow: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  myTasksLink: {
    padding: "0.4rem 0.75rem",
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    textDecoration: "none",
    borderRadius: 6,
    fontSize: "0.875rem",
    border: "1px solid rgba(255,255,255,0.3)",
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
    maxWidth: 800,
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
  createForm: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1.5rem",
  },
  input: {
    flex: 1,
    padding: "0.6rem 0.75rem",
    border: "1px solid #ccc",
    borderRadius: 8,
    fontSize: "1rem",
  },
  primaryBtn: {
    padding: "0.6rem 1rem",
    background: "#16213e",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  boardList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "0.75rem",
  },
  boardCard: {
    display: "block",
    padding: "1rem 1.25rem",
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    textDecoration: "none",
    color: "#16213e",
    fontWeight: 600,
  },
  boardName: {
    fontSize: "1rem",
  },
  muted: {
    color: "#666",
    fontSize: "0.875rem",
  },
};
