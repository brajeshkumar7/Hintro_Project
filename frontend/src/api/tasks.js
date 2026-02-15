import { api } from "./axios.js";

export async function getTasks(boardId, opts = {}) {
  const params = new URLSearchParams({ boardId });
  if (opts.listId) params.set("listId", opts.listId);
  if (opts.page) params.set("page", opts.page);
  if (opts.limit) params.set("limit", opts.limit);
  if (opts.search) params.set("search", opts.search);
  const { data } = await api.get(`/api/tasks?${params}`);
  return {
    tasks: data.tasks,
    total: data.total,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  };
}

export async function createTask(listId, payload) {
  const { data } = await api.post("/api/tasks", {
    listId,
    title: payload.title,
    description: payload.description ?? "",
    assignedTo: payload.assignedTo ?? null,
    order: payload.order,
  });
  return data.task;
}

export async function updateTask(taskId, payload) {
  const { data } = await api.put(`/api/tasks/${taskId}`, payload);
  return data.task;
}

export async function deleteTask(taskId) {
  await api.delete(`/api/tasks/${taskId}`);
}

export async function moveTask(taskId, listId, order) {
  const { data } = await api.put(`/api/tasks/${taskId}/move`, { listId, order });
  return data.task;
}
