import { api } from "./axios.js";

export async function getUsers() {
  const { data } = await api.get("/api/users");
  return data.users;
}
