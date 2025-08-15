import express from "express";
import { recordAnalyticsEvent } from "../analytics/analytics.js";
import authenticateToken from "../middleware/authenticateToken.js";
import {
  getActiveUsers,
  getSessionMetrics,
  getFeatureUsage,
  getStudyRoomMetrics,
  getErrorMetrics,
  getSearchMetrics,
  getChurnRate,
} from "../analytics/analytics.js";
import { isAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

// Route to log analytics events
router.post("/log", authenticateToken, async (req, res) => {
  try {
    const { eventType, metadata } = req.body;
    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionId;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    await recordAnalyticsEvent(eventType, userId, sessionId, metadata);
    res.status(201).json({ message: "Analytics event logged successfully" });
  } catch (error) {
    console.error("Error logging analytics event:", error);
    res.status(500).json({ error: "Failed to log analytics event" });
  }
});

// Get analytics data for a specific time period
router.get("/metrics", isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const [
      activeUsers,
      sessionMetrics,
      featureUsage,
      studyRoomMetrics,
      errorMetrics,
      searchMetrics,
      churnRate,
    ] = await Promise.all([
      getActiveUsers(start, end),
      getSessionMetrics(start, end),
      getFeatureUsage(start, end),
      getStudyRoomMetrics(start, end),
      getErrorMetrics(start, end),
      getSearchMetrics(start, end),
      getChurnRate(start, end),
    ]);

    res.json({
      activeUsers: activeUsers.length,
      sessionMetrics: sessionMetrics[0] || {
        averageDuration: 0,
        totalSessions: 0,
      },
      featureUsage,
      studyRoomMetrics: studyRoomMetrics[0] || {
        averageParticipants: 0,
        averageDuration: 0,
        totalSessions: 0,
      },
      errorMetrics,
      searchMetrics,
      churnRate,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
});

// Get detailed analytics for a specific metric
router.get("/metrics/:metric", isAdmin, async (req, res) => {
  try {
    const { metric } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    let data;
    switch (metric) {
      case "active-users":
        data = await getActiveUsers(start, end);
        break;
      case "sessions":
        data = await getSessionMetrics(start, end);
        break;
      case "features":
        data = await getFeatureUsage(start, end);
        break;
      case "studyroom":
        data = await getStudyRoomMetrics(start, end);
        break;
      case "errors":
        data = await getErrorMetrics(start, end);
        break;
      case "search":
        data = await getSearchMetrics(start, end);
        break;
      case "churn":
        data = await getChurnRate(start, end);
        break;
      default:
        return res.status(400).json({ error: "Invalid metric type" });
    }

    res.json(data);
  } catch (error) {
    console.error(`Error fetching ${req.params.metric} analytics:`, error);
    res
      .status(500)
      .json({ error: `Failed to fetch ${req.params.metric} data` });
  }
});

export default router;
