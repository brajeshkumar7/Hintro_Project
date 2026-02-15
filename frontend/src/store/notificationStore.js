import { create } from "zustand";

export const useNotificationStore = create((set) => ({
  toasts: [],

  addToast: (payload) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      type: payload.type || "task_assigned",
      message: payload.message || "You were assigned a task",
      taskTitle: payload.taskTitle,
      boardId: payload.boardId,
      boardName: payload.boardName,
      fromUserName: payload.fromUserName,
    };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    return id;
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
