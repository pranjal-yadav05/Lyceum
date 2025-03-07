import { Server } from "socket.io"
import http from "http"
import dotenv from "dotenv"
import jwt from "jsonwebtoken"

dotenv.config()

const server = http.createServer()
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 180000, // 3 minutes
  pingInterval: 10000, // 10 seconds
  connectTimeout: 60000, // 1 minute
  transports: ["websocket", "polling"],
})

const onlineUsers = new Map()

const cleanupInactiveUsers = () => {
  const now = Date.now()
  const inactivityThreshold = 360000 // 6 minutes

  for (const [userId, userData] of onlineUsers.entries()) {
    if (now - userData.lastActivity > inactivityThreshold) {
      const lastSeen = new Date()
      onlineUsers.delete(userId)
      io.emit("user_status", { userId, status: "offline", lastSeen })
    }
  }
}

setInterval(cleanupInactiveUsers, 300000) // Run every 5 minutes

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error("Authentication error: Token missing"))
    }

    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) reject(new Error("Authentication error: Invalid token"))
        else resolve(decoded)
      })
    })

    socket.user = decoded
    next()
  } catch (error) {
    next(error)
  }
})

io.on("connection", (socket) => {
  console.log("User connected:", socket.user.id)

  const updateUserStatus = (userId, status) => {
    try {
      if (status === "online") {
        onlineUsers.set(userId, {
          socketId: socket.id,
          lastActivity: Date.now(),
          lastSeen: new Date(),
        })
      } else {
        const userData = onlineUsers.get(userId)
        const lastSeen = new Date()
        if (userData) {
          userData.lastSeen = lastSeen
        }
        onlineUsers.delete(userId)
      }

      // Broadcast the status change to all connected clients
      io.emit("user_status", {
        userId,
        status,
        lastSeen: status === "offline" ? new Date() : null,
      })
    } catch (error) {
      console.error("Error updating user status:", error)
    }
  }

  // Set initial user status
  updateUserStatus(socket.user.id, "online")

  // Handle client-side status update
  socket.on("update_status", ({ status }) => {
    updateUserStatus(socket.user.id, status)
  })

  // Handle status request for specific user
  socket.on("get_user_status", (userId, callback) => {
    try {
      const userData = onlineUsers.get(userId)
      const status = userData ? "online" : "offline"
      const lastSeen = userData?.lastSeen || null

      if (typeof callback === "function") {
        callback({ status, lastSeen })
      }
    } catch (error) {
      console.error("Error getting user status:", error)
      if (typeof callback === "function") {
        callback({ status: "offline", lastSeen: null })
      }
    }
  })

  // Handle request for all online users
  socket.on("get_online_users", (callback) => {
    try {
      const onlineUsersList = Array.from(onlineUsers.keys())
      if (typeof callback === "function") {
        callback({ users: onlineUsersList })
      }
    } catch (error) {
      console.error("Error getting online users:", error)
      if (typeof callback === "function") {
        callback({ users: [] })
      }
    }
  })

  socket.on("heartbeat", (callback) => {
    try {
      const userData = onlineUsers.get(socket.user.id)
      if (userData) {
        userData.lastActivity = Date.now()
        if (typeof callback === "function") {
          callback({ status: "ok", timestamp: Date.now() })
        }
      }
    } catch (error) {
      console.error("Heartbeat error:", error)
    }
  })

  socket.on("new_message", async (message, callback) => {
    console.log("Received new_message event:", message);
    try {
      if (!message || typeof message !== "object") {
        throw new Error("Invalid message format");
      }
  
      const { sender, recipient, content } = message;
  
      if (!sender || !recipient || !content) {
        throw new Error("Missing required message properties");
      }
  
      // Broadcast to all sockets in the room or to specific users
      io.sockets.emit("receive_message", message);
  
      // Send confirmation back to sender
      callback({ status: "success" });
  
    } catch (error) {
      console.error("Error handling new message:", error);
      callback({ status: "error", error: error.message });
    }
  });

  socket.on("message_received", (messageId) => {
    // Here you could update the message status in the database if needed
    console.log(`Message ${messageId} received by client`)
  })

  socket.on("disconnect", (reason) => {
    console.log("User disconnected:", socket.user.id, "Reason:", reason)
    updateUserStatus(socket.user.id, "offline")
  })

  socket.on("check_connection", (callback) => {
    if (typeof callback === "function") {
      callback({
        status: "connected",
        userId: socket.user.id,
        isOnline: true,
        timestamp: Date.now(),
      })
    }
  })
})

const SOCKET_PORT = process.env.SOCKET_PORT || 5001
server.listen(SOCKET_PORT, () => {
  console.log(`Socket.IO server running on port ${SOCKET_PORT}`)
})

