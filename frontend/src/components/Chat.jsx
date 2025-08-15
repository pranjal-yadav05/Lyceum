import { useState, useEffect, useRef, useCallback } from "react";
import {
  getConversation,
  sendMessage,
  initializeSocket,
  isSocketConnected,
  getUserStatus,
  disconnectSocket,
  updateUserStatus,
  checkSocketConnection,
  searchUsers,
} from "../services/messageService";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "react-hot-toast";
import { Send, Loader2, Smile } from "lucide-react";
import { ChatHeader } from "./ChatHeader";
import EmojiPicker from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Textarea } from "./ui/textarea";

const Chat = ({
  selectedUserId,
  onConversationCreated,
  initialReceiverInfo,
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [receiverInfo, setReceiverInfo] = useState(
    initialReceiverInfo || {
      username: "",
      isOnline: false,
      lastSeen: null,
      profileImage: "",
    }
  );
  const scrollAreaRef = useRef(null);
  const textareaRef = useRef(null);
  const [isConnected, setIsConnected] = useState(true);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    let isSubscribed = true;

    const initializeConnection = async () => {
      try {
        const isConnected = await checkSocketConnection();
        if (isSubscribed && isConnected) {
          await updateUserStatus("online");
        }
      } catch (error) {
        console.error("Failed to initialize socket:", error);
        if (isSubscribed) {
          setError("Failed to connect to chat service");
        }
      }
    };

    initializeConnection();

    return () => {
      isSubscribed = false;
      updateUserStatus("offline");
      disconnectSocket();
    };
  }, []);

  const checkConnection = useCallback(() => {
    const connected = isSocketConnected();
    setIsConnected(connected);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    const verifyConnection = () => {
      checkConnection((response) => {
        setIsConnected(response.status === "connected");
        if (response.status !== "connected") {
          // console.log("Socket disconnected, attempting to reconnect...");
          initializeSocket();
        }
      });
    };

    reconnectTimeoutRef.current = setInterval(verifyConnection, 5000);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearInterval(reconnectTimeoutRef.current);
      }
    };
  }, [checkConnection]);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages();
      fetchReceiverInfo(selectedUserId);
    } else {
      setMessages([]);
      setReceiverInfo({
        username: "",
        isOnline: false,
        lastSeen: null,
        profileImage: "",
      });
    }
  }, [selectedUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedMessages = await getConversation(selectedUserId);

      if (!Array.isArray(fetchedMessages)) {
        throw new Error("Invalid messages response format");
      }

      setMessages(fetchedMessages);

      if (fetchedMessages.length > 0) {
        const message = fetchedMessages[0];
        const receiver =
          message.sender?._id === selectedUserId
            ? message.sender
            : message.recipient;

        if (receiver) {
          setReceiverInfo((prev) => ({
            ...prev,
            username: receiver.username || "Unknown",
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages");
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedUserId) return;

    try {
      setSending(true);
      setError(null);

      const isConnected = await checkSocketConnection();
      if (!isConnected) {
        throw new Error("Not connected to chat service");
      }

      const sentMessage = await sendMessage(selectedUserId, newMessage.trim());

      if (!sentMessage || !sentMessage._id || !sentMessage.sender) {
        console.warn("Invalid message response:", sentMessage);
        throw new Error("Invalid message response from server.");
      }

      setNewMessage("");
      scrollToBottom();

      if (messages.length === 0 && onConversationCreated) {
        onConversationCreated(selectedUserId);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message: " + err.message);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const fetchReceiverInfo = async (userId) => {
    try {
      const [userSearchResult, userStatus] = await Promise.all([
        searchUsers(userId),
        getUserStatus(userId),
      ]);

      const userInfo = userSearchResult.find((user) => user._id === userId);
      if (userInfo) {
        setReceiverInfo({
          username: userInfo.username,
          isOnline: userStatus.status === "online",
          lastSeen: userStatus.lastSeen,
          profileImage: userInfo.profileImage || "",
        });
      }
    } catch (err) {
      console.error("Error fetching receiver info:", err);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      fetchReceiverInfo(selectedUserId);
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (initialReceiverInfo) {
      setReceiverInfo(initialReceiverInfo);
    }
  }, [initialReceiverInfo]);

  const handleEmojiSelect = (emojiObject) => {
    const cursor = textareaRef.current?.selectionStart || newMessage.length;
    const text = newMessage;
    const newText =
      text.slice(0, cursor) + emojiObject.emoji + text.slice(cursor);
    setNewMessage(newText);

    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(cursor + 2, cursor + 2);
    }, 10);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message, index) => {
    if (!message || !message.sender) {
      console.warn("Message or sender is undefined:", message);
      return null;
    }

    const senderUsername = message.sender?.username || "Unknown User";
    const isCurrentUser =
      message.sender?.username === localStorage.getItem("username");

    return (
      <div
        key={index}
        className={`flex ${
          isCurrentUser ? "justify-end" : "justify-start"
        } mb-4`}
        role="listitem"
        aria-label={`Message from ${senderUsername}`}
      >
        <div
          className={`flex items-start ${
            isCurrentUser ? "flex-row-reverse mr-2" : ""
          } max-w-[80%]`}
        >
          <div
            className={`px-4 py-2 rounded-lg ${
              isCurrentUser
                ? "bg-[#6B21A8] text-white"
                : "bg-gray-700 text-white"
            } break-words whitespace-pre-wrap`}
          >
            <p className="break-words whitespace-pre-wrap">{message.content}</p>
            <small
              className="text-xs opacity-50 block text-right mt-2"
              title={new Date(message.createdAt).toLocaleString()}
            >
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </small>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#1a103d]">
      {selectedUserId && <ChatHeader {...receiverInfo} />}
      {!isConnected && (
        <div className="bg-red-500 text-white p-2 text-center" role="alert">
          Disconnected. Attempting to reconnect...
        </div>
      )}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedUserId ? (
          <>
            <ScrollArea
              ref={scrollAreaRef}
              className="flex-1"
              role="log"
              aria-label="Message history"
            >
              <div className="p-4">
                {loading ? (
                  <div
                    className="flex justify-center items-center h-full"
                    role="status"
                  >
                    <Loader2 className="w-8 h-8 text-[#6B21A8] animate-spin" />
                    <span className="sr-only">Loading messages...</span>
                  </div>
                ) : error ? (
                  <p className="text-center text-red-500" role="alert">
                    {error}
                  </p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-gray-400">
                    No messages yet. Start a conversation!
                  </p>
                ) : (
                  <div role="list" aria-label="Message list">
                    {messages.map((message, index) =>
                      renderMessage(message, index)
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="mt-auto border-t border-gray-700 bg-gray-900 p-4">
              <form
                onSubmit={handleSendMessage}
                className="flex flex-col gap-2"
                aria-label="Message input form"
              >
                <div className="flex items-start space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-white hover:bg-[#6B21A8]/50"
                        aria-label="Open emoji picker"
                      >
                        <Smile className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-full p-0 border-none"
                      side="top"
                      align="start"
                    >
                      <EmojiPicker
                        onEmojiClick={handleEmojiSelect}
                        theme="dark"
                        width="100%"
                        height={400}
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex-1">
                    <Textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type a message... (Shift + Enter for new line)"
                      className="min-h-[60px] max-h-[120px] bg-gray-800 text-white border-gray-700 resize-none"
                      disabled={sending}
                      aria-label="Message input"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-[#6B21A8] hover:bg-[#6B21A8]/90 text-white self-end"
                    disabled={sending || !newMessage.trim()}
                    aria-label={sending ? "Sending message..." : "Send message"}
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="sr-only">Sending...</span>
                      </>
                    ) : (
                      <Send size={20} />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div
            className="flex items-center justify-center h-full"
            role="status"
          >
            <p className="text-gray-400">
              Select a conversation to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
