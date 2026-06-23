import { io } from "socket.io-client";
import axios from "axios";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;
const API_URL = process.env.REACT_APP_API_URL + "/chat";
let socket = null;
let connectionPromise = null;
let currentToken = null;
let currentRefreshToken = null;

const excludedRoutes = ["/login", "/register", "/signup"];

const handleVisibilityChange = () => {
  if (document.visibilityState === "visible") {
    updateUserStatus("online").catch(() => {});
  } else if (document.visibilityState === "hidden") {
    updateUserStatus("offline").catch(() => {});
  }
};

const handleBeforeUnload = () => {
  updateUserStatus("offline").catch(() => {});
};

export const initializeSocket = async (token, refreshToken) => {
  if (token) currentToken = token;
  if (refreshToken) currentRefreshToken = refreshToken;

  if (connectionPromise) {
    return connectionPromise;
  }

  if (socket?.connected) {
    return socket;
  }

  connectionPromise = new Promise((resolve, reject) => {
    try {
      const location = window.location.pathname;
      if (excludedRoutes.includes(location)) {
        if (typeof document !== "undefined") {
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange
          );
        }
        connectionPromise = null;
        resolve(null);
        return;
      }

      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", handleVisibilityChange);
      }

      const authToken = token || currentToken;
      if (!authToken) {
        connectionPromise = null;
        resolve(null);
        return;
      }

      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }

      socket = io(SOCKET_URL, {
        auth: { token: authToken },
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      socket.on("connect", () => {
        connectionPromise = null;
        resolve(socket);
      });

      socket.on("connect_error", async (error) => {
        const isAuthError =
          error?.message === "Invalid token" ||
          error?.message === "Token missing" ||
          error?.data?.code === "TOKEN_EXPIRED";
        if (isAuthError && currentRefreshToken) {
          try {
            const freshToken = await currentRefreshToken();
            if (freshToken && socket) {
              currentToken = freshToken;
              socket.auth = { token: freshToken };
              socket.connect();
              return;
            }
          } catch (refreshErr) {
            console.error("Socket token refresh failed:", refreshErr);
          }
          connectionPromise = null;
          socket = null;
          reject(error);
          return;
        }
        // Transport errors (e.g. server down) — let socket.io retry until timeout
      });

      socket.on("disconnect", (reason) => {
        if (reason === "io server disconnect") {
          socket = null;
          connectionPromise = null;
        }
      });

      socket.connect();

      setTimeout(() => {
        if (!socket?.connected) {
          socket?.removeAllListeners();
          socket?.disconnect();
          socket = null;
          connectionPromise = null;
          console.warn("Socket connection timed out");
          resolve(null);
        }
      }, 20000);
    } catch (error) {
      console.error("Socket initialization error:", error);
      connectionPromise = null;
      socket = null;
      reject(error);
    }
  });

  return connectionPromise;
};

export const getSocket = () => {
  if (!socket?.connected) {
    return null;
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  connectionPromise = null;
};

export const isSocketConnected = () => {
  return Boolean(socket?.connected);
};

export const triggerReconnect = async () => {
  disconnectSocket();
  return initializeSocket(currentToken, currentRefreshToken);
};

export const sendMessage = async (recipientId, content) => {
  try {
    const response = await axios.post(`${API_URL}`, { recipientId, content });
    const savedMessage = response.data;

    return await withSocket((socket) => {
      return new Promise((resolve, reject) => {
        socket.emit(
          "new_message",
          {
            ...savedMessage,
            sender: {
              _id: savedMessage.sender._id,
              username: savedMessage.sender.username,
            },
            recipient: {
              _id: savedMessage.recipient._id,
              username: savedMessage.recipient.username,
            },
          },
          (socketResponse) => {
            if (socketResponse.error) {
              reject(new Error(socketResponse.error));
            } else {
              resolve(savedMessage);
            }
          }
        );
      });
    });
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const ensureSocketConnection = async () => {
  if (!socket?.connected) {
    try {
      await initializeSocket(currentToken, currentRefreshToken);
    } catch {
      return null;
    }
  }
  return socket;
};

export const subscribeToMessages = async (callback) => {
  const activeSocket = await ensureSocketConnection();
  if (!activeSocket) return () => {};
  const handler = (message) => {
    if (message && message._id && message.sender && message.content) {
      callback(message);
    }
  };
  activeSocket.on("receive_message", handler);
  return () => activeSocket.off("receive_message", handler);
};

export const subscribeToUserStatus = async (callback) => {
  const activeSocket = await ensureSocketConnection();
  if (!activeSocket) return () => {};
  activeSocket.on("user_status", callback);
  return () => activeSocket.off("user_status", callback);
};

export const getConversation = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/conversation/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error getting conversation:", error);
    throw error;
  }
};

export const getConversations = async () => {
  try {
    const response = await axios.get(`${API_URL}/conversations`);
    return response.data;
  } catch (error) {
    console.error("Error getting conversations:", error);
    if (error.response) {
      console.error("Server response error:", {
        status: error.response.status,
        data: error.response.data,
      });
    }
    throw error;
  }
};

export const searchUsers = async (query) => {
  try {
    const response = await axios.get(
      `${API_URL}/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
};

export const checkConnection = (callback) => {
  if (socket?.connected) {
    socket.emit("check_connection", callback);
  } else {
    callback({ status: "disconnected" });
  }
};

export const subscribeToNewConversations = async (callback) => {
  const activeSocket = await ensureSocketConnection();
  if (!activeSocket) {
    console.warn(
      "Socket connection timed out. Cannot subscribe to new conversations."
    );
    return () => {};
  }

  activeSocket.on("new_conversation", callback);
  return () => activeSocket.off("new_conversation", callback);
};

export const subscribeToSentMessages = async (callback) => {
  const activeSocket = await ensureSocketConnection();
  if (!activeSocket) return () => {};
  activeSocket.on("message_sent", callback);
  return () => activeSocket.off("message_sent", callback);
};

export const getUserStatus = async (userId) => {
  const activeSocket = await ensureSocketConnection();
  if (!activeSocket) return { status: "offline" };
  return new Promise((resolve) => {
    activeSocket.emit("get_user_status", userId, (response) => {
      resolve(response);
    });
  });
};

export const updateUserStatus = async (status) => {
  const activeSocket = await ensureSocketConnection();
  if (!activeSocket) {
    console.warn("Socket connection timed out. Cannot update user status.");
    return;
  }

  activeSocket.emit("update_status", { status });
};

export const acknowledgeMessage = async (messageId) => {
  const activeSocket = await ensureSocketConnection();
  if (!activeSocket) return;
  activeSocket.emit("message_received", messageId);
};

export const checkSocketConnection = async () => {
  try {
    await ensureSocketConnection();
    return true;
  } catch (error) {
    console.error("Failed to initialize socket:", error);
    return false;
  }
};

export const removeUserStatusListeners = () => {
  if (typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }
  if (typeof window !== "undefined") {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  }
};

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", handleBeforeUnload);
}

export const withSocket = async (operation) => {
  try {
    if (!socket?.connected) {
      await initializeSocket(currentToken, currentRefreshToken);
    }
    return operation(socket);
  } catch (error) {
    console.error("Socket operation failed:", error);
    throw error;
  }
};

export const getUserById = async (userId) => {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/user/by-id/${userId}`
  );
  return response.data;
};
