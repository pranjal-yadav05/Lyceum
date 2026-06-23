import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { isTokenBlacklisted } from "../utils/tokenManager.js";

function extractToken(req) {
  const cookieToken = req.cookies?.token;
  const authHeader = req.headers["authorization"];
  const headerToken = authHeader && authHeader.split(" ")[1];
  return cookieToken || headerToken;
}

/** Sets req.user when a valid token is present; continues silently when absent or invalid. */
export const optionalAuth = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    if (await isTokenBlacklisted(token)) {
      res.clearCookie("token", { path: "/" });
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = decoded;
    }
  } catch {
    res.clearCookie("token", { path: "/" });
  }
  next();
};

export const authenticateToken = async (req, res, next) => {
  const token = extractToken(req);

  if (token == null) {
    return res.status(401).json({ error: "No authentication token provided" });
  }

  try {
    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({ error: "Token has been revoked" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(403).json({ error: "User not found" });
    }

    await User.findByIdAndUpdate(decoded.id, {
      isOnline: true,
      lastSeen: new Date(),
    });
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

export default authenticateToken;