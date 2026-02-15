import express from "express";
import { User } from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", async (req, res) => {
  try {
    const users = await User.find({}).select("_id name email").sort({ name: 1 }).lean();
    res.json({
      users: users.map((u) => ({ id: u._id, name: u.name, email: u.email })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
});

export default router;
