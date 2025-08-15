import {
  recordPageView,
  recordUserActivity,
  recordError,
  recordNavigation,
  recordSearch,
} from "../analytics/analytics.js";

// Generate a unique session ID for each user session
const generateSessionId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const analyticsMiddleware = (req, res, next) => {
  // Generate or get existing session ID
  let sessionId = req.cookies.sessionId;
  if (!sessionId) {
    sessionId = generateSessionId();
    res.cookie("sessionId", sessionId, {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
    });
  }

  // Attach sessionId to request for use in other middleware/routes
  req.sessionId = sessionId;

  // Track page view
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    recordPageView(req.user?._id, sessionId, req.path).catch((error) => {
      console.error("Error recording page view (non-blocking):", error);
    });
  }

  // Track user activity
  if (req.user) {
    recordUserActivity(req.user._id, sessionId, {
      method: req.method,
      path: req.path,
      userAgent: req.headers["user-agent"],
    }).catch((error) => {
      console.error("Error recording user activity (non-blocking):", error);
    });
  }

  // Track navigation
  const referer = req.headers.referer;
  if (referer) {
    const fromPage = new URL(referer).pathname;
    recordNavigation(req.user?._id, sessionId, fromPage, req.path).catch(
      (error) => {
        console.error("Error recording navigation (non-blocking):", error);
      }
    );
  }

  // Track search queries
  if (req.path === "/api/search" && req.method === "GET") {
    const { query, type } = req.query;
    if (query) {
      recordSearch(req.user?._id, sessionId, query, type || "user");
    }
  }

  // Error tracking
  const originalSend = res.send;
  res.send = function (body) {
    if (res.statusCode >= 400) {
      recordError(req.user?._id, sessionId, {
        statusCode: res.statusCode,
        path: req.path,
        method: req.method,
        error: body,
      });
    }
    return originalSend.call(this, body);
  };

  next();
};
