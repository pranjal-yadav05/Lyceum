import express from "express";
import Topic from "../models/Topic.js";
import Post from "../models/Post.js";
import StudySession from "../models/StudySession.js";
import Visitor from "../models/Visitor.js";
import User from "../models/User.js";
import axios from "axios";
import NodeCache from "node-cache";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

router.get("/", async (req, res) => {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
    "x-username"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    let stats = cache.get("stats");
    if (!stats) {
      // If no cached stats, fetch fresh data
      const [activeTopics, totalPosts, studySessions] = await Promise.all([
        Topic.countDocuments(),
        Post.countDocuments(),
        StudySession.aggregate([
          {
            $group: {
              _id: null,
              totalDuration: { $sum: "$duration" },
            },
          },
        ]),
      ]);

      let totalStudyHours = (
        (studySessions[0]?.totalDuration || 0) / 3600
      ).toFixed(1); // Convert seconds to hours with one decimal precision
      if (totalStudyHours < 0.1) {
        totalStudyHours = 0;
      }
      const totalVisitorCount = await Visitor.countDocuments();

      stats = {
        activeTopics,
        totalPosts,
        totalStudyHours,
        totalVisitors: totalVisitorCount,
      };

      cache.set("stats", stats);
    }
    // Record visit using IP and user agent
    const ip = req.ip;
    const userAgent = req.headers["user-agent"];
    if (ip && userAgent) {
      const visitRecord = await Visitor.recordVisit(ip, userAgent);
    }

    // Stats are now guaranteed to be populated from cache or fresh fetch

    res.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res
      .status(500)
      .json({ message: "Error fetching stats", error: error.message });
  }
});

export default router;
