import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MessageSquare, Users, Plus, LogIn, Video, Menu } from "lucide-react";
import LeftSidebar from "./LeftSidebar";
import SearchDrawer from "./SearchDrawer";
import AnimatedCounter from "./AnimatedCounter";
import LoadingSpinner from "./LoadingSpinner";
import UnderDevelopmentModal from "./UnderDevelopmentModal";

const API_URL = process.env.REACT_APP_API_URL;

const Dashboard = ({ username }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const response = await fetch(`${API_URL}/stats`);
        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats(null);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      navigate(`/studyroom/${roomId}`);
    }
  };

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(7);
    navigate(`/studyroom/${newRoomId}`);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const openSearchDrawer = () => {
    setIsSearchDrawerOpen(true);
  };

  const handleExploreGroups = () => {
    setIsModalOpen(true);
  };

  const closeSearchDrawer = () => {
    setIsSearchDrawerOpen(false);
  };

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
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }`}
        />
      </div>

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "md:ml-64" : ""
        }`}
      >
        <div className="flex-1 p-4 md:p-6 md:ml-16 overflow-y-auto min-h-screen">
          <div className="max-w-6xl mx-auto">
            {/* Centered welcome message */}
            <div className="flex flex-col items-center justify-center flex-grow py-8 mb-8 mt-16 md:mt-0">
              <Button
                ref={buttonRef}
                className="md:hidden fixed top-4 left-4 bg-purple-600 hover:bg-purple-700 z-20"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                <Menu className="h-6 w-6" />
              </Button>

              <h1 className="text-center text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-t from-purple-400 to-pink-600 bg-clip-text text-transparent mb-4 animate-fade-in px-4 md:px-6 py-2 md:py-3">
                Hello {username},
              </h1>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-300 animate-slide-up">
                Welcome to Lyceum! 👋
              </h2>
            </div>

            {/* Main content */}
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6 md:mb-8 mt-8">
              {/* Study Room Card */}
              <Card className="bg-[#1a1425] border-purple-600/20">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center">
                    <Video className="mr-2 h-5 w-5 flex-shrink-0" />
                    <span className="truncate">Virtual Study Rooms</span>
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
                    Engage with other students, share knowledge, and participate
                    in meaningful discussions.
                  </p>
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => navigate("/forum")}
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
                    Connect with fellow students, form study groups, and learn
                    together.
                  </p>
                  <Button
                    onClick={handleExploreGroups}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Explore Groups
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {loadingStats ? (
                Array(4)
                  .fill(0)
                  .map((_, index) => (
                    <Card
                      key={index}
                      className="bg-[#1a1425] border-purple-600/20"
                    >
                      <CardContent className="pt-6">
                        <LoadingSpinner />
                      </CardContent>
                    </Card>
                  ))
              ) : stats ? (
                <>
                  <Card className="bg-[#1a1425] border-purple-600/20">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Active Topics
                      </h3>
                      <div className="text-3xl font-bold text-purple-400">
                        <AnimatedCounter value={stats.activeTopics} />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1a1425] border-purple-600/20">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Total Posts
                      </h3>
                      <div className="text-3xl font-bold text-purple-400">
                        <AnimatedCounter value={stats.totalPosts} />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1a1425] border-purple-600/20">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Total Study Hours
                      </h3>
                      <div className="text-3xl font-bold text-purple-400">
                        {stats.totalStudyHours}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1a1425] border-purple-600/20">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Total Visitors
                      </h3>
                      <div className="text-3xl font-bold text-purple-400">
                        <AnimatedCounter value={stats.totalVisitors} />
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="bg-[#1a1425] border-purple-600/20">
                  <CardContent className="pt-6">
                    <p className="text-center text-gray-400">
                      Failed to load stats.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      <SearchDrawer
        isOpen={isSearchDrawerOpen}
        onClose={closeSearchDrawer}
        API_URL={API_URL}
      />
      <UnderDevelopmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
