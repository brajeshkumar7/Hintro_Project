import { api } from "./axios.js";

export async function getLists(boardId) {
  const { data } = await api.get(`/api/lists/${boardId}`);
  return data.lists;
}

export async function createList(boardId, title, order) {
  const { data } = await api.post("/api/lists", { boardId, title, order });
  return data.list;
}
