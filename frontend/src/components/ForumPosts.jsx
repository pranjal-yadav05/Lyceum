import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Plus, MessageSquare, ChevronRight, ImageIcon, Bold, Italic, List, LinkIcon, Menu } from 'lucide-react';
import LeftSidebar from './LeftSidebar';
import ReactMarkdown from 'react-markdown';
import SearchDrawer from './SearchDrawer';
import LoadingSpinner from './LoadingSpinner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";

const API_URL = process.env.REACT_APP_API_URL;

export default function ForumPosts({username}) {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    topicId: '',
    author: username
  });
  const [newTopic, setNewTopic] = useState({
    title: '',
    description: '',
    category: '',
    author: username
  });
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(`${API_URL}/users/search`, {
        params: { query: searchQuery },
        withCredentials: true,
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Categories for topics
  const categories = [
    'General Discussion',
    'Study Groups',
    'Academic Help',
    'Campus Life',
    'Career Advice',
    'Events',
  ];

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

  const handleCreateTopic = async () => {
    setIsCreatingTopic(true);
    try {
      await axios.post(`${API_URL}/topics`, newTopic, {
        withCredentials: true,
      });
      setIsCreateTopicOpen(false);
      setNewTopic({ title: '', description: '', category: '' });
      fetchTopics();
    } catch (error) {
      console.error('Error creating topic:', error);
    } finally {
      setIsCreatingTopic(false);
    }
  };

  const handleCreatePost = async () => {
    setIsCreatingPost(true);
    try {
      await axios.post(`${API_URL}/topics/${selectedTopic}/posts`, newPost, {
        withCredentials: true,
      });

      setIsCreatePostOpen(false);
      setNewPost({ title: '', content: '', topicId: '' });
      fetchPosts(selectedTopic);
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleTopicSelect = (topicId) => {
    setSelectedTopic(topicId);
    fetchPosts(topicId);
    setIsSidebarOpen(false);
    setIsButtonVisible(true);
  };

  const handleDeleteTopic = async (topicId) => {
    try {
      await axios.delete(`${API_URL}/topics/${topicId}`,{
        headers: {
          'X-Username': username,
        },
        withCredentials: true,
      });
      fetchTopics(); // Refresh topics after deletion
    } catch (error) {
      console.error("Error deleting topic:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`${API_URL}/posts/${postId}`, {
        withCredentials: true,
      });
      fetchPosts(selectedTopic); // Refresh posts after deletion
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const applyStyle = (style) => {
    const textarea = document.getElementById('post-content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let styledText = '';
    let cursorOffset = 0;

    switch (style) {
      case 'bold':
        if (selectedText.startsWith('**') && selectedText.endsWith('**')) {
          styledText = selectedText.slice(2, -2);
          cursorOffset = -2;
        } else {
          styledText = `**${selectedText}**`;
          cursorOffset = 2;
        }
        break;
      case 'italic':
        if (selectedText.startsWith('*') && selectedText.endsWith('*')) {
          styledText = selectedText.slice(1, -1);
          cursorOffset = -1;
        } else {
          styledText = `*${selectedText}*`;
          cursorOffset = 1;
        }
        break;
      case 'list':
        const lines = selectedText.split('\n');
        styledText = lines.map(line => `- ${line}`).join('\n');
        if (!selectedText) {
          styledText = '- ';
        }
        break;
      case 'link':
        styledText = `[${selectedText}](url)`;
        break;
      case 'image':
        styledText = `![${selectedText}](image_url)`;
        break;
      default:
        styledText = selectedText;
    }

    const newContent = textarea.value.substring(0, start) + styledText + textarea.value.substring(end);
    setNewPost({ ...newPost, content: newContent });
    textarea.focus();
    textarea.setSelectionRange(start + styledText.length + cursorOffset, start + styledText.length + cursorOffset);
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
    // Add any other props your LeftSidebar needs
  };

  return (
    <div className="min-h-screen bg-[#0f0a1f] text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <LeftSidebar 
        {...sidebarProps}
      />

      {/* Main content */}
      <div className="flex-1 p-4 md:p-6 md:ml-16 overflow-y-auto min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Header with Tabs */}
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
              <Dialog open={isCreateTopicOpen} onOpenChange={setIsCreateTopicOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    New Topic
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a1425] text-white">
                  <DialogHeader>
                    <DialogTitle>Create New Topic</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Create a new discussion topic for others to join.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 my-4">
                    <Input
                      placeholder="Topic title"
                      value={newTopic.title}
                      onChange={(e) => setNewTopic({...newTopic, title: e.target.value})}
                      className="bg-[#2a2435] border-purple-600/20"
                    />
                    <Textarea
                      placeholder="Topic description"
                      value={newTopic.description}
                      onChange={(e) => setNewTopic({...newTopic, description: e.target.value})}
                      className="bg-[#2a2435] border-purple-600/20"
                    />
                    <Select
                      value={newTopic.category}
                      onValueChange={(value) => setNewTopic({...newTopic, category: value})}
                    >
                      <SelectTrigger className="bg-[#2a2435] border-purple-600/20">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2a2435]">
                        <SelectGroup>
                          <SelectLabel>Categories</SelectLabel>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={handleCreateTopic}
                      disabled={isCreatingTopic}
                    >
                     {isCreatingTopic ? <LoadingSpinner /> : 'Create Topic'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {isLoadingTopics ? (
            <LoadingSpinner />
            ) : (
            <Tabs defaultValue="all" className="w-full" value={selectedCategory} onValueChange={setSelectedCategory}>
              <div className="md:hidden mb-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full bg-[#1a1425] border-purple-600/20">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1425]">
                    <SelectItem value="all">All Topics</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <TabsList className="hidden md:flex bg-[#1a1425] border-purple-600/20 w-full overflow-x-auto scrollbar-none">
                <TabsTrigger className="flex-shrink-0" value="all">All Topics</TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger key={category} className="flex-shrink-0" value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topics.map((topic) => (
                    <Card 
                      key={topic._id}
                      className="bg-[#1a1425] border-purple-600/20 cursor-pointer hover:bg-[#2a2435] transition-colors"
                      onClick={() => handleTopicSelect(topic._id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-white">{topic.title}</CardTitle>
                            <span className="text-xs text-purple-400">{topic.category}</span>
                          </div>
                          {username === topic.author && (
                            <Button 
                              variant="ghost" 
                              className="text-red-500 hover:text-red-400 bg-transparent border border-red-500 hover:border-red-400 rounded-full px-2 py-1 text-xs transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTopic(topic._id);
                              }}
                            >
                              Delete Topic
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-400 text-sm mb-4">{topic.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <span>{topic.postsCount || 0} posts</span>
                          </div>
                          <span>Created by {topic.author}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {categories.map((category) => (
                <TabsContent key={category} value={category} className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topics
                      .filter((topic) => topic.category === category)
                      .map((topic) => (
                        <Card 
                          key={topic._id}
                          className="bg-[#1a1425] border-purple-600/20 cursor-pointer hover:bg-[#2a2435] transition-colors"
                          onClick={() => handleTopicSelect(topic._id)}
                        >
                          <CardHeader>
                            <CardTitle className="text-white">{topic.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-400 text-sm mb-4">{topic.description}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                <span>{topic.postsCount || 0} posts</span>
                              </div>
                              <span>Created by {topic.author}</span>
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
            )}
          </div>

          {/* Selected Topic View */}
          {selectedTopic && (
            <div className="mt-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedTopic(null)}
                  className="text-purple-400 hover:text-purple-300 mb-4 md:mb-0"
                >
                  <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                  Back to Topics
                </Button>
                <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="mr-2 h-4 w-4" />
                      New Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1a1425] text-white">
                    <DialogHeader>
                      <DialogTitle>Create New Post</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 my-4">
                      <Input
                        placeholder="Post title"
                        value={newPost.title}
                        onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                        className="bg-[#2a2435] border-purple-600/20"
                      />
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => applyStyle('bold')}>
                            <Bold className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => applyStyle('italic')}>
                            <Italic className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => applyStyle('list')}>
                            <List className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => applyStyle('link')}>
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => applyStyle('image')}>
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                          {showPreview ? 'Edit' : 'Preview'}
                        </Button>
                      </div>
                      {showPreview ? (
                        <div className="bg-[#2a2435] border-purple-600/20 rounded-md p-4 prose prose-invert max-w-none min-h-[200px]">
                          <ReactMarkdown>{newPost.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <Textarea
                          id="post-content"
                          placeholder="Write your post content..."
                          value={newPost.content}
                          onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                          className="bg-[#2a2435] border-purple-600/20 min-h-[200px] whitespace-pre-wrap"
                        />
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={handleCreatePost}
                        disabled={isCreatingPost}
                      >
                        {isCreatingPost ? <LoadingSpinner /> : 'Create Post'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              {isLoadingPosts ? (
                <LoadingSpinner />
              ) : (

              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post._id} className="bg-[#1a1425] border-purple-600/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-white mb-2">{post.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src="/placeholder.svg" />
                              <AvatarFallback>{post.author[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-400">{post.author}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {username === post.author && (
                          <Button 
                            variant="ghost" 
                            className="text-red-500 hover:text-red-400 bg-transparent border border-red-500 hover:border-red-400 rounded-full px-2 py-1 text-xs transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post._id);
                            }}
                          >
                            Delete Post
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-invert max-w-none text-white">
                        <ReactMarkdown>{post.content}</ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
               )}
            </div>
          )}
        </div>
      </div>

      <SearchDrawer isOpen={isSearchDrawerOpen} onClose={closeSearchDrawer} API_URL={API_URL} />
    </div>
  );
}

