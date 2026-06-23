import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ConversationList from "./ConversationList";
import Chat from "./Chat";
import LeftSidebar from "./LeftSidebar";
import {
  initializeSocket,
  disconnectSocket,
  triggerReconnect,
} from "../services/messageService";
import { Button } from "./ui/button";
import { Menu, ArrowLeft, Loader2, WifiOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const ChatPage = () => {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showConversations, setShowConversations] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);
  const buttonRef = useRef(null);
  const { socketToken, refreshSocketToken, isAuthenticated } = useAuth();

  const setupSocket = useCallback(
    async (isMounted) => {
      try {
        const socket = await initializeSocket(socketToken, refreshSocketToken);
        if (!isMounted) return; // Prevent state updates if unmounted
        setIsConnected(!!socket);
        setIsLoading(false);
        if (!socket) {
          toast.error("Could not connect to chat server. Is LyceumSocket running on port 5001?");
        }
      } catch (error) {
        if (!isMounted) return; // Prevent state updates if unmounted
        console.error("Socket setup error:", error);
        toast.error("Failed to connect to server: " + error.message);
        setIsConnected(false);
        setIsLoading(false);

        // Only redirect if it's specifically a token issue
        if (
          error.message.includes("No authentication token found") ||
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          // console.log("Authentication error detected, redirecting to login");
          navigate("/login");
        }
      }
    },
    [navigate, socketToken, refreshSocketToken]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!socketToken) {
      return;
    }

    let isMounted = true;

    setupSocket(isMounted);

    return () => {
      isMounted = false;
      disconnectSocket();
      setIsConnected(false);
    };
  }, [navigate, setupSocket, isAuthenticated, socketToken]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const conversationId = params.get("conversation");
    if (conversationId) {
      setSelectedConversationId(conversationId);
      setShowConversations(false);
    }
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarOpen]);

  const handleSelectConversation = (id) => {
    setSelectedConversationId(id);
    setShowConversations(false);
    navigate(`?conversation=${id}`, { replace: true });
  };

  const handleReceiverInfoFetched = (info) => {
    setReceiverInfo(info);
  };

  const handleReconnect = async () => {
    const toastId = toast.loading("Reconnecting...");
    try {
      await triggerReconnect();
      await setupSocket(true);
      toast.success("Reconnected", { id: toastId });
    } catch (error) {
      console.error("Reconnection error:", error);
      toast.error("Failed to reconnect", { id: toastId });
    }
  };

  const openSearchDrawer = () => {
    navigate("/chat");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#1a103d] items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#6B21A8] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0f0a1f] text-white flex overflow-hidden">
      {/* Main Layout */}
      <div className="flex w-full">
        {/* Left Sidebar */}
        <div className="relative">
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-20 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <LeftSidebar
            isSidebarOpen={isSidebarOpen}
            closeSidebar={() => setIsSidebarOpen(false)}
            openSearchDrawer={openSearchDrawer}
            ref={sidebarRef}
            className={`fixed md:relative z-30 h-full transition-transform duration-300 ease-in-out ${
              isSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            }`}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 md:ml-16">
          {/* Conversations List */}
          <div
            className={`w-full md:w-80 bg-gray-900 flex flex-col md:flex ${
              selectedConversationId && !showConversations ? "hidden" : "flex"
            }`}
          >
            <div className="flex items-center p-4 border-b border-gray-800">
              <Button
                ref={buttonRef}
                className="md:hidden mr-2"
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">Conversations</h1>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConversationList
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversationId}
                onReceiverInfoFetched={handleReceiverInfoFetched}
                socketReady={isConnected}
              />
            </div>
          </div>

          {/* Chat Area */}
          <div
            className={`flex-1 flex flex-col ${
              !selectedConversationId && showConversations ? "hidden" : "flex"
            }`}
          >
            {selectedConversationId && (
              <div className="md:hidden p-4 bg-gray-900 border-b border-gray-800">
                <Button
                  variant="ghost"
                  className="flex items-center"
                  onClick={() => {
                    setShowConversations(true);
                    setSelectedConversationId(null);
                  }}
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Conversations
                </Button>
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <Chat
                selectedUserId={selectedConversationId}
                onConversationCreated={handleSelectConversation}
                initialReceiverInfo={receiverInfo}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded-md flex items-center">
          <WifiOff className="h-5 w-5 mr-2" />
          <span>Disconnected</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReconnect}
            className="ml-2 bg-white text-red-500 hover:bg-red-100"
          >
            Reconnect
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
