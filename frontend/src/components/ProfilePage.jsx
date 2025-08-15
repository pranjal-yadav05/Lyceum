import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import {
  Share2,
  Edit2,
  Clock,
  Users,
  Flame,
  ArrowLeft,
  Upload,
  UserPlus,
  UserMinus,
} from "lucide-react";
import LeftSidebar from "./LeftSidebar";
import FriendRequests from "./FriendRequests";
import LoadingSpinner from "./LoadingSpinner";
import SearchDrawer from "./SearchDrawer";
import AdminShortcut from "./AdminShortcut";

const ProfilePage = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const currentUsername = localStorage.getItem("username");

  useEffect(() => {
    fetchUserProfile();
    fetchFriends();
    if (!isCurrentUser) {
      checkFriendRequestStatus();
    }
  }, [username, isCurrentUser]);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        navigate("/login");
        return;
      }

      const endpoint = `/user/profile/${username}`;

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}${endpoint}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(response.data);
      setIsCurrentUser(response.data.username === currentUsername);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        alert(error.response.data.message);
        navigate("/dashboard");
      }
      console.error("Error fetching user profile:", error);
      if (error.response && error.response.status === 401) {
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkFriendRequestStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await axios.get(
        `${API_URL}/friends/request-status/${currentUsername}/${username}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFriendRequestSent(response.data.requestSent);
    } catch (error) {
      console.error("Error checking friend request status:", error);
    }
  };

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/friends/friends/${username}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFriends(response.data);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const handleFriendRequest = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        navigate("/login");
        return;
      }

      if (friendRequestSent) {
        await removeFriendRequest();
      } else {
        await sendFriendRequest();
      }

      checkFriendRequestStatus();
    } catch (error) {
      console.error("Error handling friend request:", error);
    }
  };

  const sendFriendRequest = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/friends/send`,
        {
          senderId: currentUsername,
          receiverId: username,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFriendRequestSent(true);
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const removeFriendRequest = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/friends/remove-request`,
        {
          senderId: currentUsername,
          receiverId: username,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setFriendRequestSent(false);
    } catch (error) {
      console.error("Error removing friend request:", error);
    }
  };

  const handleImageUpload = async (event, imageType) => {
    if (!isCurrentUser) return;

    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please upload a JPEG, PNG, or GIF image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Maximum size is 5MB.");
      return;
    }
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append(
      imageType === "profile-image" ? "profile-image" : "cover-image",
      file
    );

    try {
      if (!token) {
        console.error("No token found");
        navigate("/login");
        return;
      }

      setIsUploading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/user/${imageType}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser((prevUser) => ({
        ...prevUser,
        [imageType === "profile-image" ? "profileImage" : "coverImage"]:
          response.data.url,
      }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image");

      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setIsButtonVisible(true);
  };

  const openSearchDrawer = () => {
    setIsSearchDrawerOpen(true);
  };

  const closeSearchDrawer = () => {
    setIsSearchDrawerOpen(false);
  };

  const getImageUrl = (imageUrl, type) => {
    if (imageUrl) return imageUrl;
    return type === "profile"
      ? "/images/defaultProfile.jpg"
      : "/images/defaultCover.jpg";
  };

  const handleImageError = (e) => {
    console.error("Error loading image");
  };

  const sidebarProps = {
    isSidebarOpen,
    closeSidebar,
    setIsSidebarOpen,
    isButtonVisible,
    setIsButtonVisible,
    openSearchDrawer,
  };

  const interests = [
    { icon: "🎵", label: "Lofi" },
    { icon: "🎤", label: "Taylor Swift" },
    { icon: "✈️", label: "Travel" },
    { icon: "🏊‍♂️", label: "Swimming" },
    { icon: "🚴‍♂️", label: "Cycling" },
    { icon: "🏃‍♂️", label: "Running" },
    { icon: "📚", label: "Fiction" },
    { icon: "⚡", label: "Harry Potter" },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0f0a1f]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0f0a1f] text-white">
      <LeftSidebar {...sidebarProps} />

      <div className="flex-1 overflow-y-auto md:ml-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="relative mb-8">
            <Button
              variant="outline"
              className="absolute top-4 left-4 bg-purple-600 hover:bg-purple-700 z-10"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="h-48 md:h-64 rounded-lg overflow-hidden relative">
              <img
                src={getImageUrl(user.coverImage, "cover")}
                alt="Profile cover"
                className="w-full h-full object-cover"
              />
              {isCurrentUser && (
                <label
                  htmlFor="coverImage"
                  className="absolute top-2 right-2 cursor-pointer bg-black/50 hover:bg-black/70 p-2 rounded-full transition-all"
                >
                  {isUploading ? (
                    <LoadingSpinner />
                  ) : (
                    <Upload className="h-6 w-6 text-white" />
                  )}
                  <input
                    type="file"
                    id="coverImage"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "cover-image")}
                    accept="image/*"
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
            <div className="absolute bottom-0 left-4 transform translate-y-1/2 flex items-end">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#0f0a1f] overflow-hidden bg-[#1a1425] relative group">
                <img
                  src={getImageUrl(user.profileImage, "profile")}
                  alt="Profile picture"
                  className="w-full h-full object-cover"
                />
                {isCurrentUser && (
                  <label
                    htmlFor="profileImage"
                    className="absolute inset-0 cursor-pointer bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    {isUploading ? (
                      <LoadingSpinner />
                    ) : (
                      <Upload className="h-8 w-8 text-white" />
                    )}
                    <input
                      type="file"
                      id="profileImage"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, "profile-image")}
                      accept="image/*"
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>
              <div className="ml-4 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {user.username}
                </h1>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span>📚 College</span>
                  <span>•</span>
                  <span>⚙️ Engineering</span>
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 flex gap-2">
              {!isCurrentUser && (
                <Button
                  variant="outline"
                  className={`${
                    friendRequestSent
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                  onClick={handleFriendRequest}
                >
                  {friendRequestSent ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Cancel Request
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Friend
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="info" className="mt-16">
            <TabsList className="bg-[#1a1425] border-purple-600/20 w-full justify-start overflow-x-auto">
              <TabsTrigger
                value="info"
                className="data-[state=active]:bg-purple-600"
              >
                User Info
              </TabsTrigger>
              <TabsTrigger
                value="achievements"
                className="data-[state=active]:bg-purple-600"
              >
                Achievements
              </TabsTrigger>
              <TabsTrigger
                value="friends"
                className="data-[state=active]:bg-purple-600"
              >
                Friends
              </TabsTrigger>
              {isCurrentUser && (
                <TabsTrigger
                  value="requests"
                  className="data-[state=active]:bg-purple-600"
                >
                  Friend Requests
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="info">
              <CardContent>
                <p>Info about the user</p>
              </CardContent>
            </TabsContent>
            <TabsContent value="achievements">
              <CardContent>
                <p>Achievements of the user</p>
              </CardContent>
            </TabsContent>
            <TabsContent value="friends">
              <CardContent>
                <h3 className="text-xl font-semibold mb-4">Friends</h3>
                {friends.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {friends.map((friend, index) => (
                      <div
                        key={index}
                        className="relative overflow-hidden h-24 rounded-lg cursor-pointer transition-all hover:scale-105"
                        onClick={() => navigate(`/profile/${friend.username}`)}
                        style={{
                          backgroundImage: `linear-gradient(rgba(26, 20, 37, 0.7), rgba(26, 20, 37, 0.7)), url(${getImageUrl(
                            friend.coverImage,
                            "cover"
                          )})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div className="absolute inset-0 flex items-center p-4">
                          <img
                            src={
                              getImageUrl(friend.profileImage, "profile") ||
                              "/placeholder.svg"
                            }
                            alt={friend.username}
                            className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-purple-500"
                          />
                          <span className="text-white font-semibold">
                            {friend.username}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No friends to display.</p>
                )}
              </CardContent>
            </TabsContent>
            {isCurrentUser && (
              <TabsContent value="requests">
                <CardContent>
                  <FriendRequests />
                </CardContent>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
      <SearchDrawer
        isOpen={isSearchDrawerOpen}
        onClose={closeSearchDrawer}
        API_URL={API_URL}
      />
      <AdminShortcut />
    </div>
  );
};

export default ProfilePage;
