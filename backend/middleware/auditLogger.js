import AuditLog from "../models/AuditLog.js";

export const auditLogger = async (req, res, next) => {
  const startTime = Date.now();

  // Store the original response methods
  const originalJson = res.json;
  const originalSend = res.send;

  // Override response methods to capture the response
  res.json = function (body) {
    res.locals.responseBody = body;
    return originalJson.call(this, body);
  };

  res.send = function (body) {
    res.locals.responseBody = body;
    return originalSend.call(this, body);
  };

  // Log the request after the response is sent
  res.on("finish", async () => {
    try {
      if (req.user) {
        await AuditLog.create({
          userId: req.user._id,
          action: req.method,
          resource: req.originalUrl,
          details: {
            requestBody: req.body,
            responseStatus: res.statusCode,
            responseBody: res.locals.responseBody,
            duration: Date.now() - startTime,
          },
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        });
      }
    } catch (error) {
      console.error("Error logging audit:", error);
    }
  });

  next();
};
