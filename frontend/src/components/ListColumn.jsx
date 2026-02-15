import React, { useState } from "react";
import TaskCard from "./TaskCard.jsx";
import { useBoardStore } from "../store/boardStore.js";

const DRAG_TYPE = "application/x-board-task";

export default function ListColumn({ list }) {
  const tasks = useBoardStore((s) => s.tasks.filter((t) => String(t.listId) === String(list.id)));
  const createTask = useBoardStore((s) => s.createTask);
  const moveTask = useBoardStore((s) => s.moveTask);
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleAddTask(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    try {
      await createTask(list.id, { title: title.trim() });
      setTitle("");
    } catch (_) {}
    setAdding(false);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  async function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const raw = e.dataTransfer.getData(DRAG_TYPE);
    if (!raw) return;
    try {
      const { taskId, fromListId } = JSON.parse(raw);
      if (String(fromListId) === String(list.id)) return;
      await moveTask(taskId, list.id, 0);
    } catch (_) {}
  }

  return (
    <div
      style={{ ...styles.column, ...(dragOver ? styles.columnDragOver : {}) }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h3 style={styles.listTitle}>{list.title}</h3>
      <div style={styles.taskList}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} listId={list.id} />
        ))}
      </div>
      <form onSubmit={handleAddTask} style={styles.addForm}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task"
          style={styles.input}
          disabled={adding}
        />
        <button type="submit" disabled={adding || !title.trim()} style={styles.addBtn}>
          Add
        </button>
      </form>
    </div>
  );
}

const styles = {
  column: {
    minWidth: 280,
    maxWidth: 280,
    background: "#e8e9ec",
    borderRadius: 10,
    padding: "0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    transition: "background 0.15s ease",
  },
  columnDragOver: {
    background: "#d0d4dc",
  },
  listTitle: {
    margin: 0,
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#16213e",
    padding: "0.25rem 0",
  },
  taskList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    flex: 1,
    minHeight: 40,
  },
  addForm: {
    display: "flex",
    gap: "0.25rem",
    marginTop: "0.25rem",
  },
  input: {
    flex: 1,
    padding: "0.4rem 0.5rem",
    border: "1px solid #ccc",
    borderRadius: 6,
    fontSize: "0.875rem",
  },
  addBtn: {
    padding: "0.4rem 0.6rem",
    background: "#16213e",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: "0.8rem",
    cursor: "pointer",
  },
};
