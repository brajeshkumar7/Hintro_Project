import { io } from "socket.io-client";
import { useBoardStore } from "./store/boardStore.js";
import { useNotificationStore } from "./store/notificationStore.js";

//const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = import.meta.env.MODE === 'development' ? 'http://localhost:5000' : '/';

let socket = null;

function registerHandlers() {
  if (!socket) return;

  socket.off("task:created").on("task:created", (payload) => {
    if (payload?.task) useBoardStore.getState().applyTaskCreated(payload.task);
  });

  socket.off("task:updated").on("task:updated", (payload) => {
    if (payload?.task) useBoardStore.getState().applyTaskUpdated(payload.task);
  });

  socket.off("task:deleted").on("task:deleted", (payload) => {
    if (payload?.task?.id) useBoardStore.getState().applyTaskDeleted(payload.task.id);
  });

  socket.off("task:moved").on("task:moved", (payload) => {
    if (payload?.task) useBoardStore.getState().applyTaskMoved(payload.task);
  });

  socket.off("task_assigned").on("task_assigned", (payload) => {
    if (payload?.taskTitle != null || payload?.fromUserName != null) {
      useNotificationStore.getState().addToast({
        type: "task_assigned",
        taskTitle: payload.taskTitle,
        boardId: payload.boardId,
        boardName: payload.boardName,
        fromUserName: payload.fromUserName,
      });
    }
  });
}

export function getSocket(token) {
  if (!token) return null;
  if (socket?.connected) return socket;
  socket = io(API_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });
  socket.on("connect", () => {
    registerHandlers();
  });
  if (socket.connected) registerHandlers();
  return socket;
}

export function joinBoard(boardId) {
  if (socket?.connected && boardId) {
    socket.emit("join_board", boardId, (res) => {
      if (res?.ok === false) console.warn("join_board:", res.message);
    });
  }
}

export function leaveBoard(boardId) {
  if (socket?.connected && boardId) {
    socket.emit("leave_board", boardId);
  }
}

export function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
