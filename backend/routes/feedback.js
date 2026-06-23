import express from "express";
import Feedback from "../models/Feedback.js";
import authenticateToken from "../middleware/authenticateToken.js";

const router = express.Router();

// Apply the authenticateToken middleware to the feedback route
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { feedback } = req.body;
    const userId = req.user?.id; // Extracted from the token by the middleware

    if (!feedback) {
      return res.status(400).json({ error: "Feedback is required." });
    }

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    const newFeedback = new Feedback({ feedback, user: userId });
    await newFeedback.save();

    res.status(200).json({ message: "Feedback submitted successfully." });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res
      .status(500)
      .json({ error: "Failed to submit feedback. Please try again later." });
  }
});

export default router;
