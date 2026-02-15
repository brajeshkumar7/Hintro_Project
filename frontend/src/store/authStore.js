import { create } from "zustand";
import { disconnect } from "../socket.js";

export const useAuthStore = create((set) => ({
  token: null,
  user: null,

  setAuth: (token, user) => set({ token, user }),

  logout: () => {
    disconnect();
    set({ token: null, user: null });
  },
}));

export function getAuthToken() {
  return useAuthStore.getState().token;
}

export function getAuthUser() {
  return useAuthStore.getState().user;
}

export function isAuthenticated() {
  return !!useAuthStore.getState().token;
}
