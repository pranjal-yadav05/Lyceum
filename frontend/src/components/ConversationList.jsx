import { useState, useEffect, useRef } from "react"
import { getConversations, searchUsers, subscribeToNewConversations, initializeConversation } from "../services/messageService"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Skeleton } from "./ui/skeleton"
import { Search, X, Loader2 } from "lucide-react"
import { ScrollArea } from "./ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { toast } from "react-hot-toast"

const ConversationList = ({ onSelectConversation, selectedConversationId }) => {
  const [conversations, setConversations] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  // Debounce search
  const searchTimeout = useRef(null)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true)
        setError(null)
        const fetchedConversations = await getConversations()
        setConversations(fetchedConversations)
      } catch (err) {
        console.error("Error fetching conversations:", err)
        setError("Failed to load conversations")
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()

    const unsubscribe = subscribeToNewConversations((newConversation) => {
      setConversations((prevConversations) => {
        // Check if conversation already exists
        const exists = prevConversations.some(
          (conv) => conv._id === newConversation._id || conv.participants?.some((p) => p._id === newConversation._id),
        )
        if (!exists) {
          return [newConversation, ...prevConversations]
        }
        return prevConversations
      })
    })

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe()
      }
    }
  }, [])

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      const results = await searchUsers(query)
      // Filter out current user from search results
      const currentUserId = localStorage.getItem("userId")
      const filteredResults = results.filter((user) => user._id !== currentUserId)
      setSearchResults(filteredResults)
    } catch (err) {
      console.error("Search error:", err)
      toast.error("Failed to search users")
    } finally {
      setSearching(false)
    }
  }

  const handleInputChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    // Set new timeout
    searchTimeout.current = setTimeout(() => {
      handleSearch(query)
    }, 300) // Debounce for 300ms
  }

  const handleSelectUser = async (userId) => {
    if (!userId) return;
  
    try {
      // Check if conversation already exists
      const existingConversation = conversations.find(
        (conv) => conv._id === userId || conv.participants?.some((p) => p._id === userId)
      );
  
      if (!existingConversation) {
        // Initialize conversation with a first message
        const initialMessage = await initializeConversation(userId);
        
        // Create a conversation object from the initial message
        const newConversation = {
          _id: userId,
          lastMessage: initialMessage,
          participants: [
            initialMessage.sender,
            initialMessage.recipient
          ]
        };
        
        // Update conversations list
        setConversations(prevConversations => [newConversation, ...prevConversations]);
      }
  
      // Select the conversation
      onSelectConversation(userId);
  
      // Clear search
      setSearchQuery("");
      setSearchResults([]);
      inputRef.current?.focus();
    } catch (err) {
      console.error("Error selecting user:", err);
      toast.error("Failed to start conversation");
    }
  };



  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    inputRef.current?.focus()
  }

  const renderConversationOrUser = (item) => {
    if (!item || typeof item !== "object" || !item._id) {
      console.error("Invalid item:", item);
      return null;
    }
  
    const isSelected = selectedConversationId === item._id;
    const currentUserId = localStorage.getItem("userId");
    
    // For search results
    if (searchResults.includes(item)) {
      return (
        <div
          key={item._id}
          className={`p-3 ${
            isSelected ? "bg-[#6B21A8]" : "bg-gray-700"
          } text-white rounded-lg mb-2 cursor-pointer hover:bg-[#6B21A8] transition-colors duration-200`}
          onClick={() => handleSelectUser(item._id)}
        >
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage 
                src={item.profileImage || `https://api.dicebear.com/6.x/avataaars/svg?seed=${item.username}`} 
                alt={`${item.username}'s avatar`} 
              />
              <AvatarFallback>{item.username[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-grow min-w-0">
              <p className="font-semibold truncate">{item.username}</p>
            </div>
          </div>
        </div>
      );
    }
  
    // For conversations
    const otherUser = item.participants?.find(p => p._id !== currentUserId);
    const lastMessage = item.lastMessage?.content || "No messages yet";
  
    return (
      <div
        key={item._id}
        className={`p-3 ${
          isSelected ? "bg-[#6B21A8]" : "bg-gray-700"
        } text-white rounded-lg mb-2 cursor-pointer hover:bg-[#6B21A8] transition-colors duration-200`}
        onClick={() => handleSelectUser(item._id)}
      >
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={otherUser?.profileImage || `https://api.dicebear.com/6.x/avataaars/svg?seed=${otherUser?.username}`} 
              alt={`${otherUser?.username}'s avatar`} 
            />
            <AvatarFallback>{otherUser?.username?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-semibold truncate">{otherUser?.username}</p>
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  item.isOnline ? "bg-green-500" : "bg-gray-500"
                }`}
                aria-label={item.isOnline ? "Online" : "Offline"}
              />
            </div>
            <small className="text-gray-300 truncate block">{lastMessage}</small>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="p-4 border-b border-gray-800">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={handleInputChange}
            className="w-full bg-gray-800 text-white border-gray-700 pl-10 pr-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={clearSearch}
            >
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          {searching && (
            <div className="flex justify-center items-center mb-4">
              <Loader2 className="w-6 h-6 text-[#6B21A8] animate-spin" />
            </div>
          )}

          {searchResults.length > 0 && !searching && (
            <div className="mb-4">
              <h3 className="text-white mb-2 font-semibold">Search Results:</h3>
              {searchResults.filter(Boolean).map(renderConversationOrUser)}
            </div>
          )}

          {!searching && searchQuery.trim() && searchResults.length === 0 && (
            <p className="text-sm text-gray-400 mb-4">No results found for "{searchQuery}"</p>
          )}

          {!searchQuery && (
            <>
              <h2 className="text-white mb-2 font-semibold">Conversations</h2>
              {loading ? (
                [...Array(5)].map((_, i) => <Skeleton key={i} className="w-full h-16 mb-2 bg-gray-800" />)
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : conversations.length === 0 ? (
                <p className="text-gray-400">No conversations yet</p>
              ) : (
                conversations.filter(Boolean).map(renderConversationOrUser)
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default ConversationList

