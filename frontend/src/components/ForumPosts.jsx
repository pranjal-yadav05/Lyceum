import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from "./ui/button";
import { Menu } from 'lucide-react';
import LeftSidebar from './LeftSidebar';
import SearchDrawer from './SearchDrawer';
import TopicsList from './TopicsList';
import PostsList from './PostsList';
import CreateTopicDialog from './CreateTopicDialog';
import CreatePostDialog from './CreatePostDialog';
import LoadingSpinner from './LoadingSpinner';

const API_URL = process.env.REACT_APP_API_URL;

export default function ForumPosts({username}) {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      fetchPosts(selectedTopic);
    }
  }, [selectedTopic]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isSidebarOpen && !e.target.closest('.sidebar')) {
        setIsSidebarOpen(false);
        setIsButtonVisible(true);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isSidebarOpen]);

  const fetchTopics = async () => {
    setIsLoadingTopics(true);
    try {
      const response = await axios.get(`${API_URL}/topics`, {
        withCredentials: true,
      });
      setTopics(response.data);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const fetchPosts = async (topicId) => {
    setIsLoadingPosts(true);
    try {
      const response = await axios.get(`${API_URL}/topics/${topicId}/posts`, {
        withCredentials: true,
      });
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally{
      setIsLoadingPosts(false);
    }
  };

  const handleCreateTopic = async (newTopic) => {
    try {
      await axios.post(`${API_URL}/topics`, newTopic, {
        withCredentials: true,
      });
      setIsCreateTopicOpen(false);
      fetchTopics();
    } catch (error) {
      console.error('Error creating topic:', error);
    }
  };

  const handleCreatePost = async (newPost) => {
    try {
      await axios.post(`${API_URL}/topics/${selectedTopic}/posts`, newPost, {
        withCredentials: true,
      });
      setIsCreatePostOpen(false);
      fetchPosts(selectedTopic);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleTopicSelect = (topicId) => {
    setSelectedTopic(topicId);
    fetchPosts(topicId);
    setIsSidebarOpen(false);
    setIsButtonVisible(true);
  };

  const handleDeleteTopic = async (topicId) => {
    const token = sessionStorage.getItem('token')
    try {
      await axios.delete(`${API_URL}/topics/${topicId}`,{
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true,
      });
      fetchTopics();
    } catch (error) {
      console.error("Error deleting topic:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    const token = sessionStorage.getItem('token')
    try {
      await axios.delete(`${API_URL}/posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true,
      });
      fetchPosts(selectedTopic);
    } catch (error) {
      console.error("Error deleting post:", error);
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
    setIsButtonVisible(true);
  };

  const sidebarProps = {
    isSidebarOpen,
    closeSidebar,
    openSearchDrawer,
  };

  return (
    <div className="min-h-screen bg-[#0f0a1f] text-white flex flex-col md:flex-row">
      <LeftSidebar {...sidebarProps} />

      <div className="flex-1 p-4 md:p-6 md:ml-16 overflow-y-auto min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                {isButtonVisible && (
                  <Button
                    className="md:hidden mr-4 bg-purple-600 hover:bg-purple-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSidebarOpen(true);
                    }}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                )}
                <h1 className="text-2xl font-bold">Discussion Forums</h1>
              </div>
              <CreateTopicDialog
                isOpen={isCreateTopicOpen}
                onOpenChange={setIsCreateTopicOpen}
                onCreateTopic={handleCreateTopic}
                username={username}
              />
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
              />
            )}
          </div>

          {selectedTopic && (
            <div className="mt-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedTopic(null)}
                  className="text-purple-400 hover:text-purple-300 mb-4 md:mb-0"
                >
                  Back to Topics
                </Button>
                <CreatePostDialog
                  isOpen={isCreatePostOpen}
                  onOpenChange={setIsCreatePostOpen}
                  onCreatePost={handleCreatePost}
                  username={username}
                />
              </div>
              
              {isLoadingPosts ? (
                <LoadingSpinner />
              ) : (
                <PostsList
                  posts={posts}
                  handleDeletePost={handleDeletePost}
                  username={username}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <SearchDrawer isOpen={isSearchDrawerOpen} onClose={closeSearchDrawer} API_URL={API_URL} />
    </div>
  );
}

