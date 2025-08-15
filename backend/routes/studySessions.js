import express from "express";
import StudySession from "../models/StudySession.js";

const router = express.Router();

// Create a new study session
router.post("/", async (req, res) => {
  try {
    const { userId, type, duration, startTime, endTime } = req.body;

    if (!userId || !type || !duration || !startTime || !endTime) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const studySession = new StudySession({
      userId,
      type,
      duration,
      startTime,
      endTime,
    });

    await studySession.save();
    res.status(201).json({ message: "Study session saved successfully." });
  } catch (error) {
    console.error("Error saving study session:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
