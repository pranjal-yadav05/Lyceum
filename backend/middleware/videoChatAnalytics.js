import { recordVideoChat, recordCallDuration } from "../analytics/analytics.js";
import { v4 as uuidv4 } from "uuid";

export const trackVideoChatAnalytics = (io) => {
  io.on("connection", (socket) => {
    // Generate a sessionId if not provided in handshake
    const sessionId = socket.handshake.query.sessionId || uuidv4();
    const userId = socket.handshake.query.userId;
    const roomId = socket.handshake.query.roomId;
    const startTime = Date.now();

    // Track when a user joins a video chat room
    socket.on("join-room", (roomId) => {
      // Non-blocking analytics recording
      const room = io.sockets.adapter.rooms.get(roomId);
      const participantCount = room ? room.size : 1;

      recordVideoChat(userId, sessionId, participantCount, 0, {
        roomId,
        action: "join",
      }).catch((error) => {
        console.error("Error recording video chat join (non-blocking):", error);
      });
    });

    // Track when a user leaves a video chat room
    socket.on("disconnect", () => {
      // Non-blocking analytics recording
      const duration = (Date.now() - startTime) / 1000; // Convert to seconds
      const room = io.sockets.adapter.rooms.get(roomId);
      const participantCount = room ? room.size - 1 : 0;

      Promise.all([
        recordVideoChat(userId, sessionId, participantCount, duration, {
          roomId,
          action: "leave",
        }),
        recordCallDuration(userId, sessionId, duration, {
          roomId,
        }),
      ]).catch((error) => {
        console.error(
          "Error recording video chat leave (non-blocking):",
          error
        );
      });
    });
  });
};
