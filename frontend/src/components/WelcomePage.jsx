import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MessageSquare, Users, User, Plus, LogIn, Video, Menu } from 'lucide-react';
import LeftSidebar from './LeftSidebar';
import SearchDrawer from './SearchDrawer';
import axios from 'axios';
import AnimatedCounter from './AnimatedCounter';
import LoadingSpinner from './LoadingSpinner';

const API_URL = process.env.REACT_APP_API_URL;

const WelcomePage = ({ username }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const buttonRef = useRef(null);
  const [stats, setStats] = useState({
    activeTopics: 0,
    totalPosts: 0,
    totalStudyHours: 0,
    activeRooms: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/stats`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      navigate(`/video-chat/${roomId}`);
    }
  };

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(7);
    navigate(`/video-chat/${newRoomId}`);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const openSearchDrawer = () => {
    setIsSearchDrawerOpen(true);
  };

  const closeSearchDrawer = () => {
    setIsSearchDrawerOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSidebarOpen &&
          sidebarRef.current &&
          !sidebarRef.current.contains(event.target) &&
          buttonRef.current &&
          !buttonRef.current.contains(event.target)) {
        closeSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0f0a1f] text-white">
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
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        />
      </div>
      
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'md:ml-64' : ''
      }`}>
        <div className="flex-1 p-4 md:p-6 md:ml-16 overflow-y-auto min-h-screen">
          <div className="max-w-6xl mx-auto">
            {/* Header with welcome message */}
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

            {/* Main content */}
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6 md:mb-8">
              {/* Video Chat Card */}
              <Card className="bg-[#1a1425] border-purple-600/20">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center">
                    <Video className="mr-2 h-5 w-5 flex-shrink-0" />
                    <span className="truncate">Video Chat Rooms</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Enter room ID to join..."
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="bg-[#2a2435] border-purple-600/20 text-white"
                    aria-label="Room ID"
                  />
                  <div className="flex flex-col xs:flex-row gap-2">
                    <Button 
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={handleJoinRoom}
                      disabled={!roomId.trim()}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Join Room
                    </Button>
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={handleCreateRoom}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Room
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Discussion Forums Card */}
              <Card className="bg-[#1a1425] border-purple-600/20">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5 flex-shrink-0" />
                    <span className="truncate">Discussion Forums</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-400">
                    Engage with other students, share knowledge, and participate in meaningful discussions.
                  </p>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => navigate('/forum')}
                  >
                    Browse Forums
                  </Button>
                </CardContent>
              </Card>

              {/* Study Groups Card */}
              <Card className="bg-[#1a1425] border-purple-600/20">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center">
                    <Users className="mr-2 h-5 w-5 flex-shrink-0" />
                    <span className="truncate">Study Groups</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-400">
                    Connect with fellow students, form study groups, and learn together.
                  </p>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => navigate('/study-groups')}
                  >
                    Explore Groups
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                Array(3).fill(0).map((_, index) => (
                  <Card key={index} className="bg-[#1a1425] border-purple-600/20">
                    <CardContent className="pt-6">
                      <LoadingSpinner />
                    </CardContent>
                  </Card>
                ))
              ) : (
                <>
                  <Card className="bg-[#1a1425] border-purple-600/20">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Active Topics</h3>
                      <div className="text-3xl font-bold text-purple-400"><AnimatedCounter value={stats.activeTopics} /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1a1425] border-purple-600/20">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Total Study Hours</h3>
                      <div className="text-3xl font-bold text-purple-400"><AnimatedCounter value={stats.totalStudyHours} /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1a1425] border-purple-600/20">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Total Posts</h3>
                      <div className="text-3xl font-bold text-purple-400"><AnimatedCounter value={stats.totalPosts} /></div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <SearchDrawer isOpen={isSearchDrawerOpen} onClose={closeSearchDrawer} API_URL={API_URL} />
    </div>
  );
};

export default WelcomePage;

