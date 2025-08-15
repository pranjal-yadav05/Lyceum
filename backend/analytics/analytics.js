import mongoose from "mongoose";

const analyticsEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  sessionId: {
    type: String,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const AnalyticsEvent = mongoose.model("AnalyticsEvent", analyticsEventSchema);

export const recordAnalyticsEvent = async (
  eventType,
  userId,
  sessionId,
  metadata = {}
) => {
  try {
    const analyticsEvent = new AnalyticsEvent({
      eventType,
      userId,
      sessionId,
      metadata,
    });
    await analyticsEvent.save();
    // console.log("Analytics event recorded:", eventType);
  } catch (error) {
    console.error("Error recording analytics event:", error);
  }
};

// Specific analytics functions
export const recordPageView = async (userId, sessionId, pageUrl) => {
  return recordAnalyticsEvent("PAGE_VIEW", userId, sessionId, { pageUrl });
};

export const recordUserActivity = async (userId, sessionId, metadata) => {
  return recordAnalyticsEvent("USER_ACTIVITY", userId, sessionId, metadata);
};

export const recordNavigation = async (userId, sessionId, fromPage, toPage) => {
  return recordAnalyticsEvent("NAVIGATION", userId, sessionId, {
    fromPage,
    toPage,
  });
};

export const recordSearch = async (userId, sessionId, query, type) => {
  return recordAnalyticsEvent("SEARCH", userId, sessionId, { query, type });
};

export const recordError = async (userId, sessionId, errorDetails) => {
  return recordAnalyticsEvent("ERROR", userId, sessionId, errorDetails);
};

export const getActiveUsers = async (startDate, endDate) => {
  try {
    const activeUsers = await AnalyticsEvent.distinct("userId", {
      timestamp: { $gte: startDate, $lte: endDate },
    });
    return activeUsers;
  } catch (error) {
    console.error("Error getting active users:", error);
    throw error;
  }
};

export const getSessionMetrics = async (startDate, endDate) => {
  try {
    const metrics = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          eventType: "SESSION_DURATION",
        },
      },
      {
        $group: {
          _id: null,
          averageDuration: { $avg: "$metadata.duration" },
          totalSessions: { $sum: 1 },
        },
      },
    ]);
    return metrics[0] || { averageDuration: 0, totalSessions: 0 };
  } catch (error) {
    console.error("Error getting session metrics:", error);
    throw error;
  }
};

export const getFeatureUsage = async (startDate, endDate) => {
  try {
    const usage = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          eventType: "FEATURE_USAGE",
        },
      },
      {
        $group: {
          _id: "$metadata.featureName",
          count: { $sum: 1 },
        },
      },
    ]);
    return usage;
  } catch (error) {
    console.error("Error getting feature usage:", error);
    throw error;
  }
};

export const getStudyRoomMetrics = async (startDate, endDate) => {
  try {
    const metrics = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          eventType: "VIDEO_CHAT",
        },
      },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          averageDuration: { $avg: "$metadata.duration" },
          totalParticipants: { $sum: "$metadata.participantCount" },
        },
      },
    ]);
    return (
      metrics[0] || { totalCalls: 0, averageDuration: 0, totalParticipants: 0 }
    );
  } catch (error) {
    console.error("Error getting studyroom metrics:", error);
    throw error;
  }
};

export const getErrorMetrics = async (startDate, endDate) => {
  try {
    const metrics = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          eventType: "ERROR",
        },
      },
      {
        $group: {
          _id: "$metadata.errorType",
          count: { $sum: 1 },
        },
      },
    ]);
    return metrics;
  } catch (error) {
    console.error("Error getting error metrics:", error);
    throw error;
  }
};

export const getSearchMetrics = async (startDate, endDate) => {
  try {
    const metrics = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          eventType: "SEARCH",
        },
      },
      {
        $group: {
          _id: "$metadata.searchType",
          count: { $sum: 1 },
          uniqueQueries: { $addToSet: "$metadata.query" },
        },
      },
    ]);
    return metrics;
  } catch (error) {
    console.error("Error getting search metrics:", error);
    throw error;
  }
};

export const getChurnRate = async (startDate, endDate) => {
  try {
    const [totalUsers, activeUsers] = await Promise.all([
      AnalyticsEvent.distinct("userId"),
      getActiveUsers(startDate, endDate),
    ]);

    const churnRate =
      totalUsers.length > 0
        ? ((totalUsers.length - activeUsers.length) / totalUsers.length) * 100
        : 0;

    return {
      totalUsers: totalUsers.length,
      activeUsers: activeUsers.length,
      churnRate,
    };
  } catch (error) {
    console.error("Error getting churn rate:", error);
    throw error;
  }
};

export default AnalyticsEvent;
