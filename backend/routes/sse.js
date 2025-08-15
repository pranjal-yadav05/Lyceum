import express from "express";
import cors from "cors";
import { authenticateToken } from "../middleware/authenticateToken.js";

const router = express.Router();

router.options("/connect", cors()); // Handle preflight

router.get("/connect", cors(), authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Set CORS headers
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.FRONTEND_URL || "http://localhost:3000"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res,
  };

  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId).add(newClient);

  req.on("close", () => {
    clients.get(userId)?.delete(newClient);
    if (clients.get(userId)?.size === 0) {
      clients.delete(userId);
    }
  });
});

export const sendSSEMessage = (userId, eventName, data) => {
  if (clients.has(userId)) {
    clients.get(userId).forEach((client) => {
      client.res.write(`event: ${eventName}\n`);
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
  }
};

export default router;
