import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import passport from "passport";
import session from "express-session";
import postRoutes from "./routes/posts.js";
import authRoutes from "./routes/auth.js";
import topicRoutes from "./routes/topics.js";
import statsRoutes from "./routes/stats.js";
import userRoutes from "./routes/user.js";
import adminRoutes from "./routes/admin.js";
// import studySessionRoutes from './routes/StudySession.js';
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import chatRoutes from "./routes/messages.js";
import friendRoutes from "./routes/friends.js";
import blobManagementRoutes from "./routes/blobManagement.js";
import feedbackRoutes from "./routes/feedback.js";
import adminFeedbackRoutes from "./routes/adminFeedback.js";
import analyticsRoutes from "./routes/analytics.js";
import { analyticsMiddleware } from "./middleware/analyticsMiddleware.js";
import studySessionsRoute from "./routes/studySessions.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Add security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  res.setHeader("Content-Security-Policy", "default-src 'self'");
  next();
});

// Middleware setup
const middlewares = [
  cookieParser(),
  express.json(),
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    },
  }),
  passport.initialize(),
  passport.session(),
];

middlewares.forEach((middleware) => app.use(middleware));

mongoose.set("strictQuery", true); // Set strictQuery option

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Add analytics middleware
app.use(analyticsMiddleware);

// Routes
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

app.get("/", (req, res) => res.send("Welcome to the API server..."));

// For Vercel serverless deployment
export default app;

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`API Server running on port ${PORT}`));
}
