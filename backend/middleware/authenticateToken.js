import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    console.log("No token provided");
    return res.status(401).json({ error: "No authentication token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("User not found:", decoded.id);
      return res.status(403).json({ error: "User not found" });
    }
    
    // Update user status
    await User.findByIdAndUpdate(decoded.id, { isOnline: true, lastSeen: new Date() });
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

export default authenticateToken;