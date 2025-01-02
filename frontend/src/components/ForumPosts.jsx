import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Plus, MessageSquare, ChevronRight, Image as ImageIcon, Bold, Italic, List, Link as LinkIcon } from 'lucide-react';
import LeftSidebar from './LeftSidebar';

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
  const navigate = useNavigate();

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

  const fetchTopics = async () => {
    try {
      const response = await axios.get(`${API_URL}/topics`, {
        withCredentials: true,
      });
      setTopics(response.data);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const fetchPosts = async (topicId) => {
    try {
      const response = await axios.get(`${API_URL}/topics/${topicId}/posts`, {
        withCredentials: true,
      });
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleCreateTopic = async () => {
    try {
      console.log(newTopic);
      await axios.post(`${API_URL}/topics`, newTopic, {
        withCredentials: true,
      });
      setIsCreateTopicOpen(false);
      setNewTopic({ title: '', description: '', category: '' });
      fetchTopics();
    } catch (error) {
      console.error('Error creating topic:', error);
    }
  };

  const handleCreatePost = async () => {
    try {
      
      await axios.post(`${API_URL}/topics/${selectedTopic}/posts`, newPost, {
        withCredentials: true,
      });

      setIsCreatePostOpen(false);
      setNewPost({ title: '', content: '', topicId: '' });
      fetchPosts(selectedTopic);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleTopicSelect = (topicId) => {
    setSelectedTopic(topicId);
    fetchPosts(topicId);
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


  return (
    <div className="min-h-screen min-w-screen bg-[#0f0a1f] text-white flex">
      <LeftSidebar />

      <div className="flex-1 p-6 ml-16">
        <div className="max-w-6xl mx-auto">
          {/* Header with Tabs */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Discussion Forums</h1>
              <div className="flex gap-4">
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
                      >
                        Create Topic
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="bg-[#1a1425] border-purple-600/20">
                <TabsTrigger value="all">All Topics</TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category}>
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
                      onClick={() => setSelectedTopic(topic._id)}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-white">{topic.title}</CardTitle>
                          <span className="text-xs text-purple-400">{topic.category}</span>
                        </div>
                        {username === topic.author && ( // Only render the button if the user is the author
                          <Button 
                            variant="ghost" 
                            className="text-red-500 hover:text-red-400 bg-transparent border border-red-500 hover:border-red-400 rounded-full px-2 py-1 text-xs transition-all"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering topic selection
                              handleDeleteTopic(topic._id);
                            }}
                          >
                            Delete Topic
                          </Button>
                        )}
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
                          onClick={() => setSelectedTopic(topic._id)}
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
          </div>

          {/* Selected Topic View */}
          {selectedTopic && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedTopic(null)}
                  className="text-purple-400 hover:text-purple-300"
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
                      <div className="flex gap-2 mb-2">
                        <Button variant="ghost" size="sm">
                          <Bold className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Italic className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <List className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Write your post content..."
                        value={newPost.content}
                        onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                        className="bg-[#2a2435] border-purple-600/20 min-h-[200px]"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={handleCreatePost}
                      >
                        Create Post
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

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
                      </div>
                      {username === post.author && ( // Only render the button if the user is the author
                        <Button 
                          variant="ghost" 
                          className="text-red-500 hover:text-red-400 bg-transparent border border-red-500 hover:border-red-400 rounded-full px-2 py-1 text-xs transition-all"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering parent events
                            handleDeletePost(post._id);
                          }}
                        >
                          Delete Post
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-invert max-w-none">
                        <p className="text-gray-300">{post.content}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}