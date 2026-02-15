import React, { useState } from "react";
import { useBoardStore } from "../store/boardStore.js";

export default function TaskCard({ task, listId }) {
  const members = useBoardStore((s) => s.members);
  const updateTask = useBoardStore((s) => s.updateTask);
  const deleteTask = useBoardStore((s) => s.deleteTask);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [assignedTo, setAssignedTo] = useState(task.assignedTo ? String(task.assignedTo) : "");
  const [saving, setSaving] = useState(false);

  const assignedUser = members.find((m) => String(m.id) === String(task.assignedTo));

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        assignedTo: assignedTo || null,
      });
      setEditing(false);
    } catch (_) {}
    setSaving(false);
  }

  function handleCancel() {
    setTitle(task.title);
    setDescription(task.description || "");
    setAssignedTo(task.assignedTo ? String(task.assignedTo) : "");
    setEditing(false);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this task?")) return;
    try {
      await deleteTask(task.id);
    } catch (_) {}
  }

  if (editing) {
    return (
      <div style={styles.card}>
        <form onSubmit={handleSave} style={styles.editForm}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            style={styles.input}
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={2}
            style={styles.textarea}
          />
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value || "")}
            style={styles.select}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.name}
              </option>
            ))}
          </select>
          <div style={styles.actions}>
            <button type="submit" disabled={saving} style={styles.saveBtn}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={handleCancel} style={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.body} onClick={() => setEditing(true)}>
        <span style={styles.taskTitle}>{task.title}</span>
        {task.description ? (
          <p style={styles.taskDesc}>{task.description}</p>
        ) : null}
        {assignedUser ? (
          <span style={styles.assigned}>@{assignedUser.name}</span>
        ) : null}
      </div>
      <div style={styles.footer}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          style={styles.iconBtn}
          title="Edit"
        >
          ✎
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          style={styles.iconBtn}
          title="Delete"
        >
          ×
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: 8,
    padding: "0.6rem 0.75rem",
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
    cursor: "pointer",
  },
  body: {
    minHeight: 40,
  },
  taskTitle: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#1a1a2e",
  },
  taskDesc: {
    margin: "0.25rem 0 0",
    fontSize: "0.8rem",
    color: "#555",
    lineHeight: 1.3,
  },
  assigned: {
    display: "inline-block",
    marginTop: "0.25rem",
    fontSize: "0.75rem",
    color: "#666",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.25rem",
    marginTop: "0.35rem",
    paddingTop: "0.35rem",
    borderTop: "1px solid #eee",
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    padding: "0.1rem 0.25rem",
    color: "#666",
    lineHeight: 1,
  },
  editForm: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  input: {
    padding: "0.4rem 0.5rem",
    border: "1px solid #ccc",
    borderRadius: 6,
    fontSize: "0.9rem",
  },
  textarea: {
    padding: "0.4rem 0.5rem",
    border: "1px solid #ccc",
    borderRadius: 6,
    fontSize: "0.85rem",
    resize: "vertical",
  },
  select: {
    padding: "0.35rem 0.5rem",
    border: "1px solid #ccc",
    borderRadius: 6,
    fontSize: "0.85rem",
  },
  actions: {
    display: "flex",
    gap: "0.35rem",
  },
  saveBtn: {
    padding: "0.35rem 0.6rem",
    background: "#16213e",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: "0.8rem",
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "0.35rem 0.6rem",
    background: "#eee",
    color: "#333",
    border: "none",
    borderRadius: 6,
    fontSize: "0.8rem",
    cursor: "pointer",
  },
};
