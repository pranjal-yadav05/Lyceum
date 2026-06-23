import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import postRoutes from "./routes/posts.js";
import authRoutes from "./routes/auth.js";
import topicRoutes from "./routes/topics.js";
import statsRoutes from "./routes/stats.js";
import userRoutes from "./routes/user.js";
import adminRoutes from "./routes/admin.js";
import chatRoutes from "./routes/messages.js";
import friendRoutes from "./routes/friends.js";
import blobManagementRoutes from "./routes/blobManagement.js";
import feedbackRoutes from "./routes/feedback.js";
import adminFeedbackRoutes from "./routes/adminFeedback.js";
import analyticsRoutes from "./routes/analytics.js";
import { analyticsMiddleware } from "./middleware/analyticsMiddleware.js";
import studySessionsRoute from "./routes/studySessions.js";
import meRoute from "./routes/me.js";
import focusSpacesRoutes from "./routes/focusSpaces.js";
import adminFocusSpacesRoutes from "./routes/adminFocusSpaces.js";
import focusSoundsRoutes from "./routes/focusSounds.js";
import adminFocusSoundsRoutes from "./routes/adminFocusSounds.js";
import searchRoutes from "./routes/search.js";
import { validateEnv } from "./utils/validateEnv.js";
import { connectDB } from "./utils/db.js";
import {
  notFoundHandler,
  errorHandler,
} from "./middleware/errorHandler.js";

dotenv.config();
validateEnv();

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header — same-origin or server-side proxy
      if (!origin) {
        return callback(null, true);
      }

      // Local dev: allow any localhost / 127.0.0.1 port (CRA proxy, direct API, etc.)
      if (
        process.env.NODE_ENV !== "production" &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }

      const allowed = new Set(
        [process.env.FRONTEND_URL].filter(Boolean)
      );
      if (allowed.has(origin)) {
        return callback(null, true);
      }

      // Reject without throwing — throwing becomes a 500 Internal Server Error
      callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

mongoose.set("strictQuery", true);

// Ensure DB is connected before handling requests (serverless-safe)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB connection error:", err);
    res.status(503).json({ error: "Service temporarily unavailable" });
  }
});

app.use(analyticsMiddleware);

app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", topicRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/storage", blobManagementRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin/feedback", adminFeedbackRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/studySessions", studySessionsRoute);
app.use("/api/me", meRoute);
app.use("/api/focus-spaces", focusSpacesRoutes);
app.use("/api/admin/focus-spaces", adminFocusSpacesRoutes);
app.use("/api/focus-sounds", focusSoundsRoutes);
app.use("/api/admin/focus-sounds", adminFocusSoundsRoutes);
app.use("/api/search", searchRoutes);

app.get("/", (req, res) => res.json({ status: "ok" }));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`API Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB:", err);
      process.exit(1);
    });
}
