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
