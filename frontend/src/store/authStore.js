import { create } from "zustand";
import { disconnect } from "../socket.js";

const AUTH_STORAGE_KEY = "board_auth";

function getStoredAuth() {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(AUTH_STORAGE_KEY) : null;
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.token && data?.user) return { token: data.token, user: data.user };
    return null;
  } catch (_) {
    return null;
  }
}

function saveAuth(token, user) {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
    }
  } catch (_) {}
}

function clearStoredAuth() {
  try {
    if (typeof window !== "undefined") localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (_) {}
}

const initial = getStoredAuth();

export const useAuthStore = create((set) => ({
  token: initial?.token ?? null,
  user: initial?.user ?? null,

  setAuth: (token, user) => {
    saveAuth(token, user);
    set({ token, user });
  },

  logout: () => {
    disconnect();
    clearStoredAuth();
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
