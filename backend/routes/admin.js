import express from "express";
import { isAdmin } from "../middleware/adminAuth.js";
import { auditLogger } from "../middleware/auditLogger.js";
import {
  getActiveUsers,
  getSessionMetrics,
  getFeatureUsage,
  getStudyRoomMetrics,
  getErrorMetrics,
  getSearchMetrics,
  getChurnRate,
} from "../analytics/analytics.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Settings from "../models/Settings.js";

const router = express.Router();

// Apply audit logging to all admin routes
router.use(auditLogger);

// Check admin access
router.get("/check-access", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    // console.log(
    //   "Received auth header:",
    //   authHeader ? authHeader.substring(0, 20) + "..." : "none"
    // );

    if (!authHeader) {
      // console.log("No authorization header provided");
      return res
        .status(401)
        .json({ isAdmin: false, error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      // console.log("No token found in authorization header");
      return res
        .status(401)
        .json({ isAdmin: false, error: "No token provided" });
    }

    // console.log("Token received:", token.substring(0, 10) + "...");

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Token decoded successfully. Decoded token:", {
    //   id: decoded.id,
    //   email: decoded.email,
    //   role: decoded.role,
    //   iat: decoded.iat,
    //   exp: decoded.exp,
    // });

    const user = await User.findById(decoded.id);
    if (!user) {
      // console.log("User not found for ID:", decoded.id);
      // Try to find any user with this ID to verify database connection
      const anyUser = await User.findOne();
      // console.log(
      //   "Database connection test - found user:",
      //   anyUser ? "yes" : "no"
      // );
      return res.status(401).json({ isAdmin: false, error: "User not found" });
    }

    // console.log("User found:", {
    //   id: user._id,
    //   email: user.email,
    //   role: user.role,
    // });

    // Check if user has admin role in database
    const isAdminUser = user.role === "admin";
    // console.log("Admin check result:", isAdminUser);

    res.json({ isAdmin: isAdminUser });
  } catch (error) {
    console.error("Admin check error:", error);
    if (error.name === "JsonWebTokenError") {
      // console.log("Invalid token format or signature");
      return res.status(401).json({ isAdmin: false, error: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      // console.log("Token has expired");
      return res.status(401).json({ isAdmin: false, error: "Token expired" });
    }
    res.status(401).json({ isAdmin: false, error: "Invalid token" });
  }
});

// Apply admin middleware to all routes
router.use(isAdmin);

// Admin dashboard routes
router.get("/dashboard", async (req, res) => {
  try {
    const [
      activeUsers,
      sessionMetrics,
      featureUsage,
      studyRoomMetrics,
      errorMetrics,
      searchMetrics,
      churnRate,
      settings,
    ] = await Promise.all([
      getActiveUsers(),
      getSessionMetrics(),
      getFeatureUsage(),
      getStudyRoomMetrics(),
      getErrorMetrics(),
      getSearchMetrics(),
      getChurnRate(),
      Settings.getSettings(),
    ]);

    res.json({
      activeUsers,
      sessionMetrics,
      featureUsage,
      studyRoomMetrics,
      errorMetrics,
      searchMetrics,
      churnRate,
      settings,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update admin settings
router.post("/settings", async (req, res) => {
  try {
    const { setting, value } = req.body;

    // Validate setting and value
    if (!setting || value === undefined) {
      return res.status(400).json({ error: "Setting and value are required" });
    }

    // Update the setting
    const updates = { [setting]: value };
    const updatedSettings = await Settings.updateSettings(
      updates,
      req.user._id
    );

    res.json({
      success: true,
      message: `Setting ${setting} updated successfully`,
      settings: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Get detailed analytics for a specific metric
router.get("/metrics/:metric", async (req, res) => {
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

// Get all users with their authentication methods
router.get("/users-auth-methods", async (req, res) => {
  try {
    const users = await User.find({}, "username googleId"); // Fetch username and googleId only

    const usersWithAuthMethods = users.map((user) => ({
      username: user.username,
      authMethod: user.googleId ? "google" : "password",
    }));

    res.json(usersWithAuthMethods);
  } catch (error) {
    console.error("Error fetching users with auth methods:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
