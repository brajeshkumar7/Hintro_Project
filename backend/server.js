import http from "http";
import dotenv from "dotenv";
import { connectDB } from "./db/connect.js";
import "./models/index.js";
import app from "./app.js";
import { setupSocket } from "./socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

const io = setupSocket(httpServer);
app.set("io", io);

async function start() {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
