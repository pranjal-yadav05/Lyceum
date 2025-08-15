import express from "express";
import Feedback from "../models/Feedback.js";
import { isAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

// Get all feedback submissions (admin only)
router.get("/", isAdmin, async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate("user", "username") // Populate the user field with the username
      .sort({ createdAt: -1 });
    res.status(200).json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch feedback. Please try again later." });
  }
});

// Add a route to mark feedback as reviewed
router.patch("/:id/review", isAdmin, async (req, res) => {
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

// Add a route to mark feedback as pending
router.patch("/:id/pending", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { reviewed: false },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found." });
    }

    res.status(200).json({ message: "Feedback marked as pending.", feedback });
  } catch (error) {
    console.error("Error marking feedback as pending:", error);
    res.status(500).json({ error: "Failed to mark feedback as pending." });
  }
});

export default router;
