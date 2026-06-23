"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import ConfirmDialog from "./ConfirmDialog";
import { toast } from "react-hot-toast";
import { Button } from "./ui/button";
import { Menu } from "lucide-react";
import LeftSidebar from "./LeftSidebar";
import SearchDrawer from "./SearchDrawer";
import TopicsList from "./TopicsList";
import PostsView from "./PostsView";
import LoadingSpinner from "./LoadingSpinner";

const API_URL = process.env.REACT_APP_API_URL;

export default function ForumPosts({ username }) {
  const location = useLocation();
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(() => {
    const saved = localStorage.getItem("selectedTopic");
    return saved ? JSON.parse(saved) : null;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const saved = localStorage.getItem("selectedCategory");
    return saved || "all";
  });
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [deleteTopicId, setDeleteTopicId] = useState(null);
  const buttonRef = useRef(null);
  const sidebarRef = useRef(null);

  const fetchTopics = useCallback(async () => {
    setIsLoadingTopics(true);
    try {
      const response = await axios.get(`${API_URL}/topics`, {
        withCredentials: true,
      });
      const fetchedTopics = response.data || [];

      setSelectedTopic((current) => {
        if (!current) return current;
        const selectedId = typeof current === "object" ? current._id : current;
        const stillExists = fetchedTopics.some((t) => t._id === selectedId);
        if (!stillExists) {
          localStorage.removeItem("selectedTopic");
          toast.error("That topic no longer exists");
          return null;
        }
        return current;
      });

      const uniqueAuthors = [
        ...new Set(fetchedTopics.map((t) => t.author).filter(Boolean)),
      ];
      const authorImageEntries = await Promise.all(
        uniqueAuthors.map(async (author) => {
          try {
            const res = await axios.get(`${API_URL}/user/profile/${author}`);
            return [author, res.data.coverImage || null];
          } catch (err) {
            console.error(`Error fetching cover image for ${author}:`, err);
            return [author, null];
          }
        })
      );
      const authorImageMap = Object.fromEntries(authorImageEntries);

      setTopics(
        fetchedTopics.map((topic) => ({
          ...topic,
          authorCoverImage: authorImageMap[topic.author] || null,
        }))
      );
    } catch (error) {
      console.error("Error fetching topics:", error);
      setTopics([]);
    } finally {
      setIsLoadingTopics(false);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    const topicId = location.state?.selectTopicId;
    if (!topicId) return;
    setSelectedTopic(topicId);
    window.history.replaceState({}, document.title);
  }, [location.state]);

  useEffect(() => {
    localStorage.setItem("selectedTopic", JSON.stringify(selectedTopic));
  }, [selectedTopic]);

  useEffect(() => {
    localStorage.setItem("selectedCategory", selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        closeSidebar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarOpen]);

  const handleCreateTopic = async (newTopic) => {
    try {
      await axios.post(`${API_URL}/topics`, newTopic, {
        withCredentials: true,
      });
      toast.success("Topic created");
      fetchTopics();
    } catch (error) {
      console.error("Error creating topic:", error);
      toast.error("Failed to create topic");
    }
  };

  const handleTopicSelect = (topicId) => {
    setSelectedTopic(topicId);
    setIsSidebarOpen(false);
  };

  const handleDeleteTopic = async (topicId) => {
    try {
      await axios.delete(`${API_URL}/topics/${topicId}`);
      toast.success("Topic deleted");
      fetchTopics();
      if (selectedTopic === topicId) {
        setSelectedTopic(null);
      }
    } catch (error) {
      console.error("Error deleting topic:", error);
      toast.error("Failed to delete topic");
    }
  };

  const openSearchDrawer = () => {
    setIsSearchDrawerOpen(true);
  };

  const closeSearchDrawer = () => {
    setIsSearchDrawerOpen(false);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="h-screen bg-[#0f0a1f] text-white flex flex-col md:flex-row overflow-hidden">
      <div className="md:relative">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={closeSidebar}
          />
        )}

        <LeftSidebar
          isSidebarOpen={isSidebarOpen}
          closeSidebar={closeSidebar}
          openSearchDrawer={openSearchDrawer}
          ref={sidebarRef}
          className={`fixed md:relative z-30 h-full transition-transform duration-300 ease-in-out ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }`}
        />
      </div>

      <div className="flex-1 md:ml-16 flex flex-col md:flex-row overflow-hidden">
        <div
          className={`w-full bg-gray-900 p-4 overflow-y-auto ${
            selectedTopic ? "hidden" : ""
          }`}
        >
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center justify-center w-full">
                <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 leading-relaxed">
                  Lyceum Forums
                </h1>
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
              handleDeleteTopic={(id) => setDeleteTopicId(id)}
              username={username}
              selectedTopic={selectedTopic}
              handleCreateTopic={handleCreateTopic}
            />
          )}
        </div>

        <div
          className={`flex-1 overflow-hidden ${
            selectedTopic ? "w-full" : "hidden"
          }`}
        >
          {selectedTopic ? (
            <PostsView
              topicId={selectedTopic}
              username={username}
              onClose={() => setSelectedTopic(null)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-lg">
                Select a topic to view posts
              </p>
            </div>
          )}
        </div>
      </div>

      <SearchDrawer
        isOpen={isSearchDrawerOpen}
        onClose={closeSearchDrawer}
        API_URL={API_URL}
      />

      <Button
        ref={buttonRef}
        className={`fixed top-4 left-4 bg-purple-600 hover:bg-purple-700 ${
          !isSidebarOpen && !selectedTopic ? "block" : "hidden"
        } md:hidden`}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <Menu className="h-4 w-4" />
      </Button>

      <ConfirmDialog
        open={!!deleteTopicId}
        onOpenChange={(open) => !open && setDeleteTopicId(null)}
        title="Delete topic?"
        description="All posts in this topic will also be removed."
        confirmLabel="Delete"
        destructive
        onConfirm={() => handleDeleteTopic(deleteTopicId)}
      />
    </div>
  );
}
