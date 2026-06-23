import express from "express";
import StudySession from "../models/StudySession.js";
import { authenticateToken } from "../middleware/authenticateToken.js";
import { recordStudySession } from "../analytics/analytics.js";

const VALID_TYPES = ["discussion", "chat", "studysession"];

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { type, duration, startTime, endTime } = req.body;

    if (!type || duration == null || !startTime || !endTime) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`,
      });
    }

    const durationNum = Number(duration);
    if (!Number.isFinite(durationNum) || durationNum < 0) {
      return res.status(400).json({ error: "Duration must be a positive number." });
    }

    const studySession = new StudySession({
      userId: req.user.id,
      type,
      duration: durationNum,
      startTime,
      endTime,
    });

    await studySession.save();

    recordStudySession(req.user.id, req.sessionId, {
      type,
      duration: durationNum,
    }).catch(() => {});

    res.status(201).json({
      message: "Study session saved successfully.",
      id: studySession._id,
    });
  } catch (error) {
    console.error("Error saving study session:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
