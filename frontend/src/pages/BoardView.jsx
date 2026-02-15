import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useBoardStore } from "../store/boardStore.js";
import { useAuthStore } from "../store/authStore.js";
import { getSocket, joinBoard, leaveBoard } from "../socket.js";
import ListColumn from "../components/ListColumn.jsx";

export default function BoardView() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const {
    boards,
    currentBoardId,
    lists,
    fetchBoards,
    fetchBoardData,
    createList,
    clearBoard,
    loading,
    error,
    clearError,
  } = useBoardStore();

  const [newListTitle, setNewListTitle] = useState("");
  const [addingList, setAddingList] = useState(false);

  const board = boards.find((b) => b.id === boardId) || (currentBoardId === boardId ? { id: boardId, name: "…" } : null);

  useEffect(() => {
    if (!boardId) return;
    fetchBoardData(boardId).catch(() => {});
    return () => clearBoard();
  }, [boardId, fetchBoardData, clearBoard]);

  useEffect(() => {
    if (boards.length === 0) fetchBoards().catch(() => {});
  }, [boards.length, fetchBoards]);

  useEffect(() => {
    if (!boardId || !token) return;
    const s = getSocket(token);
    if (!s) return;
    if (s.connected) {
      joinBoard(boardId);
    } else {
      s.once("connect", () => joinBoard(boardId));
    }
    return () => leaveBoard(boardId);
  }, [boardId, token]);

  async function handleAddList(e) {
    e.preventDefault();
    if (!newListTitle.trim() || !boardId) return;
    setAddingList(true);
    clearError();
    try {
      await createList(boardId, newListTitle.trim());
      setNewListTitle("");
    } catch (_) {}
    setAddingList(false);
  }

  if (!boardId) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Link to="/" style={styles.backLink}>
            ← Boards
          </Link>
          <h1 style={styles.boardName}>{board?.name ?? "Board"}</h1>
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
        <div style={styles.listsWrap}>
          {loading ? (
            <p style={styles.muted}>Loading…</p>
          ) : (
            <>
              {lists.map((list) => (
                <ListColumn key={list.id} list={list} />
              ))}
              <div style={styles.addColumn}>
                <form onSubmit={handleAddList} style={styles.addListForm}>
                  <input
                    type="text"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    placeholder="New list title"
                    style={styles.input}
                    disabled={addingList}
                  />
                  <button
                    type="submit"
                    disabled={addingList || !newListTitle.trim()}
                    style={styles.addListBtn}
                  >
                    {addingList ? "Adding…" : "Add list"}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
    background: "#f0f2f5",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 1.5rem",
    background: "#16213e",
    color: "#fff",
    flexShrink: 0,
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
  boardName: {
    margin: 0,
    fontSize: "1.15rem",
    fontWeight: 700,
  },
  main: {
    flex: 1,
    padding: "1rem 1.5rem",
    overflow: "auto",
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
  listsWrap: {
    display: "flex",
    gap: "1rem",
    alignItems: "flex-start",
    overflowX: "auto",
    minHeight: 200,
    paddingBottom: "0.5rem",
  },
  addColumn: {
    minWidth: 280,
    maxWidth: 280,
    background: "#e8e9ec",
    borderRadius: 10,
    padding: "0.75rem",
  },
  addListForm: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  input: {
    padding: "0.5rem 0.6rem",
    border: "1px solid #ccc",
    borderRadius: 6,
    fontSize: "0.9rem",
  },
  addListBtn: {
    padding: "0.5rem",
    background: "#16213e",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  muted: {
    color: "#666",
    fontSize: "0.875rem",
  },
};
