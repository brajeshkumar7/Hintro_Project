import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";

export default function Home() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>App</h1>
        <div style={styles.userRow}>
          <span style={styles.userName}>{user?.name || user?.email}</span>
          <button type="button" onClick={handleLogout} style={styles.logoutBtn}>
            Log out
          </button>
        </div>
      </header>
      <main style={styles.main}>
        <p style={styles.welcome}>You’re logged in. Auth state is kept in memory for this session.</p>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
    background: "#f5f5f5",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 2rem",
    background: "#16213e",
    color: "#fff",
  },
  title: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: 700,
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  userName: {
    fontSize: "0.875rem",
    opacity: 0.9,
  },
  logoutBtn: {
    padding: "0.4rem 0.75rem",
    background: "transparent",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.5)",
    borderRadius: 6,
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  main: {
    padding: "2rem",
    maxWidth: 640,
    margin: "0 auto",
  },
  welcome: {
    margin: "0 0 1rem",
    color: "#333",
  },
};
