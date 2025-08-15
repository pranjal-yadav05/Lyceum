import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 180000,
  pingInterval: 10000,
  connectTimeout: 60000,
  transports: ["websocket", "polling"],
});

const onlineUsers = new Map();
const INACTIVITY_THRESHOLD = 6 * 60 * 1000; // 6 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

setInterval(() => {
  const now = Date.now();

  for (const [userId, userData] of onlineUsers.entries()) {
    if (now - userData.lastActivity > INACTIVITY_THRESHOLD) {
      onlineUsers.delete(userId);
      io.emit("user_status", {
        userId,
        status: "offline",
        lastSeen: new Date(),
      });
    }
  }
}, CLEANUP_INTERVAL);

// Middleware for JWT auth
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) return next(new Error("Token missing"));

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Invalid token"));
    socket.user = decoded;
    next();
  });
});

io.on("connection", (socket) => {
  const userId = socket.user.id;
  // console.log(`User connected: ${userId}`);

  const updateUserStatus = (status) => {
    const now = new Date();

    if (status === "online") {
      onlineUsers.set(userId, {
        socketId: socket.id,
        lastActivity: Date.now(),
        lastSeen: now,
      });
    } else {
      onlineUsers.delete(userId);
    }

    io.emit("user_status", {
      userId,
      status,
      lastSeen: status === "offline" ? now : null,
    });
  };

  updateUserStatus("online");

  // Event handlers
  socket.on("update_status", ({ status }) => updateUserStatus(status));

  socket.on("get_user_status", (targetId, callback) => {
    const userData = onlineUsers.get(targetId);
    callback?.({
      status: userData ? "online" : "offline",
      lastSeen: userData?.lastSeen || null,
    });
  });

  socket.on("get_online_users", (callback) => {
    callback?.({ users: [...onlineUsers.keys()] });
  });

  socket.on("heartbeat", (callback) => {
    const userData = onlineUsers.get(userId);
    if (userData) userData.lastActivity = Date.now();
    callback?.({ status: "ok", timestamp: Date.now() });
  });

  socket.on("new_message", ({ sender, recipient, content }, callback) => {
    if (!sender || !recipient || !content) {
      return callback?.({ status: "error", error: "Missing message data" });
    }

    const recipientSocketId = onlineUsers.get(recipient)?.socketId;

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receive_message", {
        sender,
        recipient,
        content,
      });
    }

    callback?.({ status: "success" });
  });

  socket.on("message_received", (messageId) => {
    // console.log(`Message ${messageId} acknowledged by client`);
  });

  socket.on("disconnect", (reason) => {
    // console.log(`User disconnected: ${userId}, Reason: ${reason}`);
    if (
      ["ping timeout", "transport close", "io server disconnect"].includes(
        reason
      )
    ) {
      console.warn(`Disconnection due to: ${reason}`);
    }
    updateUserStatus("offline");
  });

  socket.on("check_connection", (callback) => {
    callback?.({
      status: "connected",
      userId,
      isOnline: true,
      timestamp: Date.now(),
    });
  });
});

const PORT = process.env.SOCKET_PORT || 5001;
server.listen(PORT, () => {
  console.log(`✅ Socket.IO server running on port ${PORT}`);
});
