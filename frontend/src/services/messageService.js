import { io } from "socket.io-client";
import axios from "axios";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5001";
const API_URL = process.env.REACT_APP_API_URL + "/chat";
let socket = null;
let connectionPromise = null;

const excludedRoutes = ["/login", "/register", "/signup"];

const handleVisibilityChange = () => {
  if (document.visibilityState === "visible") {
    updateUserStatus("online");
  } else if (document.visibilityState === "hidden") {
    updateUserStatus("offline");
  }
};

const handleBeforeUnload = () => {
  updateUserStatus("offline");
};

export const initializeSocket = async () => {
  // If there's already a connection attempt in progress, return that promise
  if (connectionPromise) {
    return connectionPromise;
  }

  // If socket exists and is connected, return it
  if (socket?.connected) {
    return socket;
  }

  connectionPromise = new Promise((resolve, reject) => {
    try {
      const location = window.location.pathname; // Get the current route
      // console.log("Current route:", location); // Log the current route
      if (excludedRoutes.includes(location)) {
        // Remove visibilitychange listener if on excluded routes
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

      // Add visibilitychange listener for allowed routes
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", handleVisibilityChange);
      }

      const token = localStorage.getItem("token");
      // console.log("Loaded token:", token); // Log the token for debugging
      // console.log("Token:", token); // Log the token
      if (!token) {
        connectionPromise = null;
        throw new Error("No authentication token found");
      }

      // Clean up existing socket if it exists
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }

      socket = io(SOCKET_URL, {
        auth: {
          token: token,
        },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      // Set up connection handlers
      socket.on("connect", () => {
        // console.log("Socket connected");
        connectionPromise = null;
        resolve(socket);
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        connectionPromise = null;
        socket = null;
        reject(error);
      });

      socket.on("disconnect", (reason) => {
        // console.log("Socket disconnected:", reason);
        if (reason === "io server disconnect") {
          // Server disconnected us, need to reconnect manually
          socket = null;
          connectionPromise = null;
        }
      });

      socket.connect();

      // Cleanup listeners if connection takes too long
      setTimeout(() => {
        if (!socket?.connected) {
          socket?.removeAllListeners();
          socket?.disconnect();
          socket = null;
          connectionPromise = null;
          console.warn("Socket connection timed out"); // Log the timeout
          resolve(null); // Resolve with a fallback value instead of rejecting
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
  return initializeSocket();
};

export const sendMessage = async (recipientId, content) => {
  try {
    // First save via REST API
    const response = await axios.post(
      `${API_URL}`,
      {
        recipientId,
        content,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const savedMessage = response.data;

    // Use the new withSocket helper
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

// Refactor to centralize socket initialization and prevent redundant calls
export const ensureSocketConnection = async () => {
  if (!socket?.connected) {
    await initializeSocket();
  }
  return socket;
};

export const subscribeToMessages = async (callback) => {
  const activeSocket = await ensureSocketConnection();
  activeSocket.on("receive_message", (message) => {
    if (message && message._id && message.sender && message.content) {
      callback(message);
    } else {
      console.warn("Received malformed message:", message);
    }
  });
  return () => activeSocket.off("receive_message", callback);
};

export const subscribeToUserStatus = async (callback) => {
  const activeSocket = await ensureSocketConnection();
  activeSocket.on("user_status", callback);
  return () => activeSocket.off("user_status", callback);
};

export const getConversation = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/conversation/${userId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting conversation:", error);
    throw error;
  }
};

export const getConversations = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("No token available in localStorage");
      throw new Error("Authentication token not found");
    }

    // console.log("Making request to:", `${API_URL}/conversations`);
    // console.log("Using token:", token.substring(0, 10) + "..."); // Log partial token for debugging

    const response = await axios.get(`${API_URL}/conversations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error getting conversations:", error);

    // More detailed error reporting
    if (error.response) {
      // Server responded with an error status
      console.error("Server response error:", {
        status: error.response.status,
        data: error.response.data,
      });

      if (error.response.status === 403) {
        console.error(
          "Auth token might be invalid or expired. Try logging in again."
        );
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error("No response received from server");
    }

    throw error; // Re-throw the error for the caller to handle
  }
};

export const searchUsers = async (query) => {
  try {
    const response = await axios.get(
      `${API_URL}/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
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
    return () => {}; // Return a no-op cleanup function
  }

  activeSocket.on("new_conversation", callback);
  return () => activeSocket.off("new_conversation", callback);
};

export const subscribeToSentMessages = async (callback) => {
  const activeSocket = await ensureSocketConnection();
  activeSocket.on("message_sent", callback);
  return () => activeSocket.off("message_sent", callback);
};

export const getUserStatus = async (userId) => {
  const activeSocket = await ensureSocketConnection();
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

// Add event listeners for page visibility changes and beforeunload
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", handleBeforeUnload);
}

export const initializeConversation = async (userId) => {
  try {
    const response = await axios.post(
      `${API_URL}`,
      {
        recipientId: userId,
        content: "👋",
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    // Transform the response to match conversation structure
    const initialMessage = response.data;
    const currentUserId = localStorage.getItem("userId");
    const otherUser =
      initialMessage.sender._id === currentUserId
        ? initialMessage.recipient
        : initialMessage.sender;

    return {
      _id: otherUser._id,
      participants: [initialMessage.sender, initialMessage.recipient],
      lastMessage: initialMessage,
      username: otherUser.username,
      profileImage: otherUser.profileImage,
    };
  } catch (error) {
    console.error("Error initializing conversation:", error);
    throw error;
  }
};

export const withSocket = async (operation) => {
  try {
    if (!socket?.connected) {
      await initializeSocket();
    }
    return operation(socket);
  } catch (error) {
    console.error("Socket operation failed:", error);
    throw error;
  }
};
