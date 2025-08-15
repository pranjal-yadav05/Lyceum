import {
  recordStudySession,
  recordUserActivity,
} from "../analytics/analytics.js";

export const trackStudySessionAnalytics = (req, res, next) => {
  const startTime = Date.now();
  const sessionId = req.sessionId;
  const userId = req.user?._id;

  // Track study session start
  if (req.path === "/api/study-sessions" && req.method === "POST") {
    recordStudySession(userId, sessionId, 0, {
      action: "start",
      subject: req.body.subject,
      topic: req.body.topic,
    });
  }

  // Track study session end
  const originalSend = res.send;
  res.send = function (body) {
    if (req.path === "/api/study-sessions" && req.method === "PUT") {
      const duration = (Date.now() - startTime) / 1000; // Convert to seconds
      recordStudySession(userId, sessionId, duration, {
        action: "end",
        sessionId: req.params.id,
      });
    }
    return originalSend.call(this, body);
  };

  next();
};
