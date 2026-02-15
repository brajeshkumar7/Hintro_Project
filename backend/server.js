import http from "http";
import path from "path";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./db/connect.js";
import "./models/index.js";
import app from "./app.js";
import { setupSocket } from "./socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();
const httpServer = http.createServer(app);

const io = setupSocket(httpServer);
app.set("io", io);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'dist', 'index.html'))
  })
}

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
