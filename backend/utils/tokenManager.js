import jwt from "jsonwebtoken";
import BlacklistedToken from "../models/BlacklistedToken.js";
import User from "../models/User.js";

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};

export const verifyToken = async (token) => {
  try {
    // Check if token is blacklisted
    const isBlacklisted = await BlacklistedToken.findOne({ token });
    if (isBlacklisted) {
      throw new Error("Token has been revoked");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw error;
  }
};

export const blacklistToken = async (token, reason = "User logged out") => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const expiresAt = new Date(decoded.exp * 1000);

    await BlacklistedToken.create({
      token,
      reason,
      expiresAt,
    });

    return true;
  } catch (error) {
    console.error("Error blacklisting token:", error);
    return false;
  }
};

export const isTokenBlacklisted = async (token) => {
  try {
    const blacklistedToken = await BlacklistedToken.findOne({ token });
    return !!blacklistedToken;
  } catch (error) {
    console.error("Error checking token blacklist:", error);
    return false;
  }
};
