import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import ConversationList from "./ConversationList"
import Chat from "./Chat"
import LeftSidebar from "./LeftSidebar"
import { initializeSocket, disconnectSocket, checkSocketConnection } from "../services/messageService"
import { Button } from "./ui/button"
import { Menu, ArrowLeft, Loader2, WifiOff } from "lucide-react"
import { toast } from "react-hot-toast"

const ChatPage = () => {
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showConversations, setShowConversations] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarRef = useRef(null)
  const [socket, setSocket] = useState(null)
  const buttonRef = useRef(null)

  const setupSocket = useCallback(async () => {
    try {
      const socket = await initializeSocket()
      setSocket(socket)
      setIsConnected(true)
      setIsLoading(false)
      toast.success("Connected to server")
    } catch (error) {
      console.error("Socket setup error:", error)
      toast.error("Failed to connect to server: " + error.message)
      setIsConnected(false)
      setIsLoading(false)
      if (error.message.includes("No authentication token found")) {
        navigate("/login")
      }
    }
  }, [navigate])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      navigate("/login")
      return
    }

    setupSocket()

    return () => {
      disconnectSocket()
      setSocket(null)
    }
  }, [navigate, setupSocket])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const conversationId = params.get("conversation")
    if (conversationId) {
      setSelectedConversationId(conversationId)
      setShowConversations(false)
    }
  }, [location])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsSidebarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isSidebarOpen])

  const handleSelectConversation = (id) => {
    setSelectedConversationId(id)
    setShowConversations(false)
    navigate(`?conversation=${id}`, { replace: true })
  }

  const handleReconnect = async () => {
    toast.loading("Attempting to reconnect...")
    try {
      const isConnected = await checkSocketConnection()
      if (isConnected) {
        setIsConnected(true)
        toast.success("Reconnected to server")
      } else {
        throw new Error("Failed to reconnect")
      }
    } catch (error) {
      console.error("Reconnection error:", error)
      toast.error("Failed to reconnect")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#1a103d] items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#6B21A8] animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#0f0a1f] text-white flex overflow-hidden">
      {/* Main Layout */}
      <div className="flex w-full">
        {/* Left Sidebar */}
        <div className="relative">
          {isSidebarOpen && (
            <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />
          )}

          <LeftSidebar
            isSidebarOpen={isSidebarOpen}
            closeSidebar={() => setIsSidebarOpen(false)}
            ref={sidebarRef}
            className={`fixed md:relative z-30 h-full transition-transform duration-300 ease-in-out ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            }`}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 md:ml-16">
          {/* Conversations List */}
          <div
            className={`w-full md:w-80 bg-gray-900 flex flex-col ${
              selectedConversationId && !showConversations ? "hidden md:flex" : "flex"
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
              />
            </div>
          </div>

          {/* Chat Area */}
          <div
            className={`flex-1 flex flex-col ${
              !selectedConversationId && !showConversations ? "hidden md:flex" : "flex"
            }`}
          >
            {selectedConversationId && (
              <div className="md:hidden p-4 bg-gray-900 border-b border-gray-800">
                <Button
                  variant="ghost"
                  className="flex items-center"
                  onClick={() => {
                    setShowConversations(true)
                    setSelectedConversationId(null)
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
                socket={socket}
                onConversationCreated={handleSelectConversation}
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
    // <div>
    //   Under Construction...🚧
    // </div>
  )
}

export default ChatPage

