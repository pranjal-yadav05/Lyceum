import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { recordAnalyticsEvent } from "../analytics/analytics.js";
import BlacklistedToken from "../models/BlacklistedToken.js";

export const isAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    // console.log(
    //   "Admin middleware - Received auth header:",
    //   authHeader ? authHeader.substring(0, 20) + "..." : "none"
    // );

    if (!authHeader) {
      // console.log("Admin middleware - No authorization header provided");
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      // console.log("Admin middleware - No token found in authorization header");
      return res.status(401).json({ error: "No token provided" });
    }

    // Check if token is blacklisted
    const isBlacklisted = await BlacklistedToken.findOne({ token });
    if (isBlacklisted) {
      // console.log("Admin middleware - Token is blacklisted");
      return res.status(401).json({ error: "Token has been revoked" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Admin middleware - Token decoded:", {
    //   id: decoded.id,
    //   email: decoded.email,
    //   role: decoded.role,
    // });

    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      // console.log("Admin middleware - User not found for ID:", decoded.id);
      return res.status(401).json({ error: "User not found" });
    }

    // console.log("Admin middleware - User found:", {
    //   id: user._id,
    //   email: user.email,
    //   role: user.role,
    // });

    // Check if user has admin role
    if (user.role !== "admin") {
      // console.log("Admin middleware - User does not have admin role");
      // Log failed admin access attempt
      await recordAnalyticsEvent(
        "ADMIN_ACCESS_DENIED",
        decoded.id,
        req.sessionId,
        {
          email: user.email,
          path: req.path,
          method: req.method,
          ip: req.ip,
        }
      );

      return res
        .status(403)
        .json({ error: "Access denied. Admin privileges required." });
    }

    // Log successful admin access
    await recordAnalyticsEvent(
      "ADMIN_ACCESS_GRANTED",
      decoded.id,
      req.sessionId,
      {
        email: user.email,
        path: req.path,
        method: req.method,
        ip: req.ip,
      }
    );

    req.user = user;
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    if (error.name === "JsonWebTokenError") {
      // console.log("Admin middleware - Invalid token format or signature");
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      // console.log("Admin middleware - Token has expired");
      return res.status(401).json({ error: "Session expired" });
    }
    res.status(401).json({ error: "Invalid token" });
  }
};
