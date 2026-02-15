import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useBoardStore } from "../store/boardStore.js";
import { useAuthStore } from "../store/authStore.js";
import { getSocket, joinBoard, leaveBoard } from "../socket.js";
import ListColumn from "../components/ListColumn.jsx";
import ActivityPanel from "../components/ActivityPanel.jsx";

const SEARCH_DEBOUNCE_MS = 300;

export default function BoardView() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const {
    boards,
    currentBoardId,
    lists,
    taskSearch,
    taskPage,
    taskTotalPages,
    tasksLoadingMore,
    fetchBoards,
    fetchBoardData,
    createList,
    clearBoard,
    setTaskSearch,
    fetchTasksSearch,
    fetchMoreTasks,
    loading,
    error,
    clearError,
  } = useBoardStore();

  const [newListTitle, setNewListTitle] = useState("");
  const [addingList, setAddingList] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [activityPanelOpen, setActivityPanelOpen] = useState(false);
  const searchDebounceRef = useRef(null);
  const searchInitialMount = useRef(true);

  useEffect(() => {
    if (searchInitialMount.current) {
      searchInitialMount.current = false;
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setTaskSearch(searchInput.trim());
      if (boardId) fetchTasksSearch(boardId);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput, boardId, setTaskSearch, fetchTasksSearch]);

  const board = boards.find((b) => b.id === boardId) || (currentBoardId === boardId ? { id: boardId, name: "…" } : null);

  useEffect(() => {
    if (!boardId) return;
    setSearchInput("");
    searchInitialMount.current = true;
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
        <div style={styles.headerRight}>
          <Link to="/my-tasks" style={styles.myTasksLink}>
            Assigned to me
          </Link>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search tasks…"
            style={styles.searchInput}
          />
          <button
            type="button"
            onClick={() => setActivityPanelOpen(true)}
            style={styles.activityBtn}
          >
            Activity
          </button>
        </div>
      </header>
      <ActivityPanel
        boardId={boardId}
        isOpen={activityPanelOpen}
        onClose={() => setActivityPanelOpen(false)}
      />
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
        {!loading && taskTotalPages > 1 && taskPage < taskTotalPages && (
          <div style={styles.loadMoreWrap}>
            <button
              type="button"
              onClick={() => fetchMoreTasks(boardId)}
              disabled={tasksLoadingMore}
              style={styles.loadMoreBtn}
            >
              {tasksLoadingMore ? "Loading…" : "Load more tasks"}
            </button>
          </div>
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
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  searchInput: {
    padding: "0.4rem 0.6rem",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: 6,
    fontSize: "0.875rem",
    width: 180,
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
  },
  activityBtn: {
    padding: "0.4rem 0.75rem",
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.4)",
    borderRadius: 6,
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  backLink: {
    color: "rgba(255,255,255,0.9)",
    textDecoration: "none",
    fontSize: "0.875rem",
  },
  myTasksLink: {
    color: "rgba(255,255,255,0.9)",
    textDecoration: "none",
    fontSize: "0.875rem",
    padding: "0.35rem 0.6rem",
    background: "rgba(255,255,255,0.1)",
    borderRadius: 6,
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
  loadMoreWrap: {
    marginTop: "1rem",
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
};
