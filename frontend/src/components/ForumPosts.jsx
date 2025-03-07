"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { Button } from "./ui/button"
import { Menu } from "lucide-react"
import LeftSidebar from "./LeftSidebar"
import SearchDrawer from "./SearchDrawer"
import TopicsList from "./TopicsList"
import PostsView from "./PostsView"
import LoadingSpinner from "./LoadingSpinner"

const API_URL = process.env.REACT_APP_API_URL

export default function ForumPosts({ username }) {
  const [topics, setTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState(() => {
    const saved = localStorage.getItem("selectedTopic")
    return saved ? JSON.parse(saved) : null
  })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const saved = localStorage.getItem("selectedCategory")
    return saved || "all"
  })
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false)
  const [isLoadingTopics, setIsLoadingTopics] = useState(true)
  const buttonRef = useRef(null)
  const sidebarRef = useRef(null)

  useEffect(() => {
    fetchTopics()
  }, [])

  useEffect(() => {
    localStorage.setItem("selectedTopic", JSON.stringify(selectedTopic))
  }, [selectedTopic])

  useEffect(() => {
    localStorage.setItem("selectedCategory", selectedCategory)
  }, [selectedCategory])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        closeSidebar()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isSidebarOpen])

  const fetchTopics = async () => {
    setIsLoadingTopics(true)
    try {
      const response = await axios.get(`${API_URL}/topics`, {
        withCredentials: true,
      })
      setTopics(response.data)
    } catch (error) {
      console.error("Error fetching topics:", error)
    } finally {
      setIsLoadingTopics(false)
    }
  }

  const handleCreateTopic = async (newTopic) => {
    try {
      await axios.post(`${API_URL}/topics`, newTopic, {
        withCredentials: true,
      })
      fetchTopics()
    } catch (error) {
      console.error("Error creating topic:", error)
    }
  }

  const handleTopicSelect = (topicId) => {
    setSelectedTopic(topicId)
    setIsSidebarOpen(false)
  }

  const handleDeleteTopic = async (topicId) => {
    const token = localStorage.getItem("token")
    try {
      await axios.delete(`${API_URL}/topics/${topicId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      fetchTopics()
      if (selectedTopic === topicId) {
        setSelectedTopic(null)
      }
    } catch (error) {
      console.error("Error deleting topic:", error)
    }
  }

  const openSearchDrawer = () => {
    setIsSearchDrawerOpen(true)
  }

  const closeSearchDrawer = () => {
    setIsSearchDrawerOpen(false)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <div className="h-screen bg-[#0f0a1f] text-white flex flex-col md:flex-row overflow-hidden">
      <div className="md:relative">
        {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={closeSidebar} />}

        <LeftSidebar
          isSidebarOpen={isSidebarOpen}
          closeSidebar={closeSidebar}
          openSearchDrawer={openSearchDrawer}
          ref={sidebarRef}
          className={`fixed md:relative z-30 h-full transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        />
      </div>

      <div className="flex-1 md:ml-16 flex flex-col md:flex-row overflow-hidden">
        <div
          className={`w-full md:w-64 lg:w-80 bg-gray-900 p-4 overflow-y-auto ${selectedTopic ? "hidden md:block" : ""}`}
        >
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Button
                  ref={buttonRef}
                  className="md:hidden mr-4 bg-purple-600 hover:bg-purple-700"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">Welcome, {username}! 👋</h1>
              </div>
            </div>
          </div>

          {isLoadingTopics ? (
            <LoadingSpinner />
          ) : (
            <TopicsList
              topics={topics}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              handleTopicSelect={handleTopicSelect}
              handleDeleteTopic={handleDeleteTopic}
              username={username}
              selectedTopic={selectedTopic}
              handleCreateTopic={handleCreateTopic}
            />
          )}
        </div>

        <div className={`flex-1 overflow-hidden ${selectedTopic ? "" : "hidden md:block"}`}>
          {selectedTopic ? (
            <PostsView topicId={selectedTopic} username={username} onClose={() => setSelectedTopic(null)} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-lg">Select a topic to view posts</p>
            </div>
          )}
        </div>
      </div>

      <SearchDrawer isOpen={isSearchDrawerOpen} onClose={closeSearchDrawer} API_URL={API_URL} />
    </div>
  )
}

