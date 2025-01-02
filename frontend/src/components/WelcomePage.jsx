import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MessageSquare, Users, User, Plus, LogIn, Video } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import LeftSidebar from './LeftSidebar';

const WelcomePage = ({username}) => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      navigate(`/video-chat/${roomId}`);
    }
  };

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(7);
    navigate(`/video-chat/${newRoomId}`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0a1f]">
      <LeftSidebar />
      
      {/* Scrollable main content */}
      <div className="flex-1 min-w-0 ml-16 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto min-w-[280px]">
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-white">Welcome, {username}! 👋</h1>
              <Button 
                variant="outline" 
                className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap"
                onClick={() => navigate('/profile')}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </header>

            {/* Main cards grid */}
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6 md:mb-8">
              {/* Video Chat Card */}
              <Card className="bg-[#1a1425] border-purple-600/20 min-w-[250px]">
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
              <Card className="bg-[#1a1425] border-purple-600/20 min-w-[250px]">
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
              <Card className="bg-[#1a1425] border-purple-600/20 min-w-[250px]">
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
              <Card className="bg-[#1a1425] border-purple-600/20 min-w-[250px]">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Active Forums</h3>
                  <p className="text-3xl font-bold text-purple-400">12</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1425] border-purple-600/20 min-w-[250px]">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Study Hours</h3>
                  <p className="text-3xl font-bold text-purple-400">24</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1425] border-purple-600/20 min-w-[250px]">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Active Rooms</h3>
                  <p className="text-3xl font-bold text-purple-400">5</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;