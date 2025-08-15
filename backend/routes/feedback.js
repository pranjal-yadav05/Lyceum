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

// Added routes to mark feedback as reviewed and filter by reviewed status
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { reviewed } = req.query;
    const filter = {};

    if (reviewed !== undefined) {
      filter.reviewed = reviewed === "true";
    }

    const feedbackList = await Feedback.find(filter).populate(
      "user",
      "username"
    );
    res.status(200).json(feedbackList);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ error: "Failed to fetch feedback." });
  }
});

router.patch("/:id/review", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { reviewed: true },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found." });
    }

    res.status(200).json({ message: "Feedback marked as reviewed.", feedback });
  } catch (error) {
    console.error("Error marking feedback as reviewed:", error);
    res.status(500).json({ error: "Failed to mark feedback as reviewed." });
  }
});

export default router;
