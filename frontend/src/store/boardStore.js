import { create } from "zustand";
import * as boardsApi from "../api/boards.js";
import * as listsApi from "../api/lists.js";
import * as tasksApi from "../api/tasks.js";

export const useBoardStore = create((set, get) => ({
  boards: [],
  currentBoardId: null,
  lists: [],
  tasks: [],
  members: [],
  loading: false,
  error: null,

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  fetchBoards: async () => {
    set({ loading: true, error: null });
    try {
      const boards = await boardsApi.getBoards();
      set({ boards, loading: false });
      return boards;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to load boards",
        loading: false,
      });
      throw err;
    }
  },

  setCurrentBoard: (boardId) => set({ currentBoardId: boardId }),

  clearBoard: () =>
    set({
      currentBoardId: null,
      lists: [],
      tasks: [],
      members: [],
    }),

  fetchBoardData: async (boardId) => {
    if (!boardId) return;
    set({ loading: true, error: null, currentBoardId: boardId });
    try {
      const [lists, { tasks }, members] = await Promise.all([
        listsApi.getLists(boardId),
        tasksApi.getTasks(boardId, { limit: 100 }),
        boardsApi.getBoardMembers(boardId),
      ]);
      set({ lists, tasks, members, loading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to load board",
        loading: false,
      });
      throw err;
    }
  },

  createBoard: async (name) => {
    set({ error: null });
    try {
      const board = await boardsApi.createBoard(name);
      set((s) => ({ boards: [board, ...s.boards] }));
      return board;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create board";
      set({ error: msg });
      throw err;
    }
  },

  createList: async (boardId, title) => {
    set({ error: null });
    try {
      const list = await listsApi.createList(boardId, title);
      set((s) => ({ lists: [...s.lists, list] }));
      return list;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create list";
      set({ error: msg });
      throw err;
    }
  },

  createTask: async (listId, payload) => {
    set({ error: null });
    try {
      const task = await tasksApi.createTask(listId, payload);
      set((s) => ({ tasks: [...s.tasks, task] }));
      return task;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create task";
      set({ error: msg });
      throw err;
    }
  },

  updateTask: async (taskId, payload) => {
    set({ error: null });
    try {
      const task = await tasksApi.updateTask(taskId, payload);
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === task.id ? task : t)),
      }));
      return task;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update task";
      set({ error: msg });
      throw err;
    }
  },

  deleteTask: async (taskId) => {
    set({ error: null });
    try {
      await tasksApi.deleteTask(taskId);
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId) }));
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete task";
      set({ error: msg });
      throw err;
    }
  },

  moveTask: async (taskId, listId, order) => {
    set({ error: null });
    try {
      const task = await tasksApi.moveTask(taskId, listId, order);
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === task.id ? task : t)),
      }));
      return task;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to move task";
      set({ error: msg });
      throw err;
    }
  },

  applyTaskCreated: (task) => {
    const { lists, tasks } = get();
    const listIds = lists.map((l) => String(l.id));
    if (!listIds.includes(String(task.listId))) return;
    if (tasks.some((t) => String(t.id) === String(task.id))) return;
    set((s) => ({ tasks: [...s.tasks, task] }));
  },

  applyTaskUpdated: (task) => {
    const { lists } = get();
    const listIds = lists.map((l) => String(l.id));
    if (!listIds.includes(String(task.listId))) return;
    set((s) => ({
      tasks: s.tasks.map((t) => (String(t.id) === String(task.id) ? task : t)),
    }));
  },

  applyTaskDeleted: (taskId) => {
    set((s) => ({ tasks: s.tasks.filter((t) => String(t.id) !== String(taskId)) }));
  },

  applyTaskMoved: (task) => {
    const { lists } = get();
    const listIds = lists.map((l) => String(l.id));
    if (!listIds.includes(String(task.listId))) return;
    set((s) => ({
      tasks: s.tasks.map((t) => (String(t.id) === String(task.id) ? task : t)),
    }));
  },
}));
