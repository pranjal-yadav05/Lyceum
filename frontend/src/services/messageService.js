import { io } from "socket.io-client"
import axios from "axios"

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5001"
const API_URL = process.env.REACT_APP_API_URL + "/chat"
let socket = null
let connectionPromise = null

export const initializeSocket = async () => {
  // If there's already a connection attempt in progress, return that promise
  if (connectionPromise) {
    return connectionPromise
  }

  // If socket exists and is connected, return it
  if (socket?.connected) {
    return socket
  }

  connectionPromise = new Promise((resolve, reject) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        connectionPromise = null
        throw new Error("No authentication token found")
      }

      // Clean up existing socket if it exists
      if (socket) {
        socket.removeAllListeners()
        socket.disconnect()
      }

      socket = io(SOCKET_URL, {
        auth: {
          token: token
        },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      })

      // Set up connection handlers
      socket.on("connect", () => {
        console.log("Socket connected")
        connectionPromise = null
        resolve(socket)
      })

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error)
        connectionPromise = null
        socket = null
        reject(error)
      })

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason)
        if (reason === "io server disconnect") {
          // Server disconnected us, need to reconnect manually
          socket = null
          connectionPromise = null
        }
      })

      socket.connect()

      // Cleanup listeners if connection takes too long
      setTimeout(() => {
        if (!socket?.connected) {
          socket?.removeAllListeners()
          socket?.disconnect()
          socket = null
          connectionPromise = null
          reject(new Error("Connection timeout"))
        }
      }, 20000)
    } catch (error) {
      console.error("Socket initialization error:", error)
      connectionPromise = null
      socket = null
      reject(error)
    }
  })

  return connectionPromise
}

export const getSocket = () => {
  if (!socket?.connected) {
    return null
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  connectionPromise = null
}

export const isSocketConnected = () => {
  return Boolean(socket?.connected)
}

export const triggerReconnect = async () => {
  disconnectSocket()
  return initializeSocket()
}

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
    )

    const savedMessage = response.data

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
            }
          },
          (socketResponse) => {
            if (socketResponse.error) {
              reject(new Error(socketResponse.error))
            } else {
              resolve(savedMessage)
            }
          }
        )
      })
    })
  } catch (error) {
    console.error("Error sending message:", error)
    throw error
  }
}

export const subscribeToMessages = async (callback) => {
  if (!socket?.connected) {
    await initializeSocket();
  }
  
  socket.on("receive_message", (message) => {
    // Ensure message has all required fields
    if (message && message._id && message.sender && message.content) {
      callback(message);
    } else {
      console.warn("Received malformed message:", message);
    }
  });
  
  return () => socket.off("receive_message", callback);
};

export const subscribeToUserStatus = async (callback) => {
  if (!socket?.connected) {
    await initializeSocket()
  }
  socket.on("user_status", callback)
  return () => socket.off("user_status", callback)
}

export const getConversation = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/conversation/${userId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
    return response.data
  } catch (error) {
    console.error("Error getting conversation:", error)
    throw error
  }
}

export const getConversations = async () => {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.error("No token available in localStorage");
      throw new Error("Authentication token not found");
    }

    console.log("Making request to:", `${API_URL}/conversations`);
    console.log("Using token:", token.substring(0, 10) + "..."); // Log partial token for debugging

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
        data: error.response.data
      });
      
      if (error.response.status === 403) {
        console.error("Auth token might be invalid or expired. Try logging in again.");
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
    const response = await axios.get(`${API_URL}/search?q=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
    return response.data
  } catch (error) {
    console.error("Error searching users:", error)
    throw error
  }
}

export const checkConnection = (callback) => {
  if (socket?.connected) {
    socket.emit("check_connection", callback)
  } else {
    callback({ status: "disconnected" })
  }
}

export const subscribeToNewConversations = async (callback) => {
  try {
    if (!socket?.connected) {
      await initializeSocket()
    }
    socket.on("new_conversation", callback)
    return () => socket.off("new_conversation", callback)
  } catch (error) {
    console.error("Error subscribing to new conversations:", error)
    return () => {}
  }
}

export const subscribeToSentMessages = async (callback) => {
  try {
    if (!socket?.connected) {
      await initializeSocket()
    }
    socket.on("message_sent", callback)
    return () => socket.off("message_sent", callback)
  } catch (error) {
    console.error("Error subscribing to sent messages:", error)
    return () => {}
  }
}

export const getUserStatus = async (userId) => {
  try {
    if (!socket?.connected) {
      await initializeSocket()
    }
    return new Promise((resolve) => {
      socket.emit("get_user_status", userId, (response) => {
        resolve(response)
      })
    })
  } catch (error) {
    return { status: "offline", lastSeen: null }
  }
}

export const updateUserStatus = async (status) => {
  try {
    if (!socket?.connected) {
      socket = await initializeSocket()
    }
    if (socket?.connected) {
      socket.emit("update_status", { status })
    }
  } catch (error) {
    console.error("Error updating user status:", error)
  }
}

export const acknowledgeMessage = async (messageId) => {
  try {
    if (!socket?.connected) {
      await initializeSocket()
    }
    socket.emit("message_received", messageId)
  } catch (error) {
    console.error("Error acknowledging message:", error)
  }
}

export const checkSocketConnection = async () => {
  try {
    if (!socket?.connected) {
      await initializeSocket()
      return true
    }
    return true
  } catch (error) {
    console.error("Failed to initialize socket:", error)
    return false
  }
}


// Add an event listener for page visibility changes
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      updateUserStatus("online")
    } else {
      updateUserStatus("offline")
    }
  })
}

// Add an event listener for beforeunload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    updateUserStatus("offline")
  })
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
    const otherUser = initialMessage.sender._id === currentUserId 
      ? initialMessage.recipient 
      : initialMessage.sender;

    return {
      _id: otherUser._id,
      participants: [initialMessage.sender, initialMessage.recipient],
      lastMessage: initialMessage,
      username: otherUser.username,
      profileImage: otherUser.profileImage
    };
  } catch (error) {
    console.error("Error initializing conversation:", error);
    throw error;
  }
};

export const withSocket = async (operation) => {
  try {
    if (!socket?.connected) {
      await initializeSocket()
    }
    return operation(socket)
  } catch (error) {
    console.error("Socket operation failed:", error)
    throw error
  }
}