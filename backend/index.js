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
// import studySessionRoutes from './routes/StudySession.js';
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import chatRoutes from "./routes/messages.js";
import friendRoutes from "./routes/friends.js";
import blobManagementRoutes from "./routes/blobManagement.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  })
);

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
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", topicRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/storage", blobManagementRoutes);

app.get("/", (req, res) => res.send("Welcome to the API server..."));

// For Vercel serverless deployment
export default app;

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`API Server running on port ${PORT}`));
}
