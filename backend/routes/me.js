import express from "express";
import User from "../models/User.js";
import { optionalAuth, authenticateToken } from "../middleware/authenticateToken.js";
import { generateSocketToken } from "../utils/tokenManager.js";

const router = express.Router();

const MAX_FOCUS_GOALS = 50;
const MAX_GOAL_TEXT = 500;

function normalizeTasks(raw) {
  if (!Array.isArray(raw)) return null;
  const tasks = [];
  for (const item of raw.slice(0, MAX_FOCUS_GOALS)) {
    if (!item || typeof item !== "object") continue;
    const id = typeof item.id === "string" ? item.id.trim() : "";
    const text = typeof item.text === "string" ? item.text.trim().slice(0, MAX_GOAL_TEXT) : "";
    if (!id || !text) continue;
    tasks.push({ id, text, done: Boolean(item.done) });
  }
  return tasks;
}

router.get("/", optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ user: null, socketToken: null });
    }

    const user = await User.findById(req.user.id).select(
      "_id username email role profileImage"
    );
    if (!user) {
      return res.json({ user: null, socketToken: null });
    }

    const socketToken = generateSocketToken(user);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage ?? null,
      },
      socketToken,
    });
  } catch (error) {
    console.error("Error in /api/me:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/focus-goals", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("focusSessionGoals");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ tasks: user.focusSessionGoals ?? [] });
  } catch (error) {
    console.error("Error fetching focus goals:", error);
    res.status(500).json({ error: "Failed to load focus goals" });
  }
});

router.put("/focus-goals", authenticateToken, async (req, res) => {
  try {
    const tasks = normalizeTasks(req.body?.tasks);
    if (tasks === null) {
      return res.status(400).json({ error: "tasks must be an array" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { focusSessionGoals: tasks },
      { new: true, runValidators: true }
    ).select("focusSessionGoals");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ tasks: user.focusSessionGoals ?? [] });
  } catch (error) {
    console.error("Error saving focus goals:", error);
    res.status(500).json({ error: "Failed to save focus goals" });
  }
});

export default router;
