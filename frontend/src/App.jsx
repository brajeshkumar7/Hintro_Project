import React from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>App is running</h1>
      <p>
        API base URL: <code>{API_BASE_URL}</code>
      </p>
    </div>
  );
}

export default App;
