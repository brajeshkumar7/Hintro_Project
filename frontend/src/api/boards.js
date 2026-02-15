import { api } from "./axios.js";

export async function getBoards() {
  const { data } = await api.get("/api/boards");
  return data.boards;
}

export async function createBoard(name) {
  const { data } = await api.post("/api/boards", { name });
  return data.board;
}

export async function getBoardMembers(boardId) {
  const { data } = await api.get(`/api/boards/${boardId}/members`);
  return data.members;
}

export async function getBoardActivity(boardId, opts = {}) {
  const params = new URLSearchParams();
  if (opts.page) params.set("page", opts.page);
  if (opts.limit) params.set("limit", opts.limit);
  const { data } = await api.get(`/api/boards/${boardId}/activity?${params}`);
  return {
    activities: data.activities,
    total: data.total,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  };
}
