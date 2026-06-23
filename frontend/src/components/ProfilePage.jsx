import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import {
  Share2,
  ArrowLeft,
  Upload,
  UserPlus,
  UserMinus,
  Clock,
  BookOpen,
  MessageSquare,
  Users,
  Tag,
  Sparkles,
} from "lucide-react";
import LeftSidebar from "./LeftSidebar";
import FriendRequests from "./FriendRequests";
import LoadingSpinner from "./LoadingSpinner";
import SearchDrawer from "./SearchDrawer";
import AdminShortcut from "./AdminShortcut";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { resolveImageUrl } from "../lib/imageUrl";
import { cn } from "../lib/utils";

function getAchievements(stats) {
  return [
    {
      id: "study-scholar",
      name: "Study Scholar",
      description: "Log 1 hour of focused study time",
      icon: Clock,
      earned: stats.studyHours >= 1,
      progress: Math.min(stats.studyHours / 1, 1),
      progressLabel: `${stats.studyHours}h / 1h`,
      gradient: "from-violet-600 to-purple-500",
    },
    {
      id: "contributor",
      name: "Contributor",
      description: "Share 5 posts in the forum",
      icon: MessageSquare,
      earned: stats.postCount >= 5,
      progress: Math.min(stats.postCount / 5, 1),
      progressLabel: `${stats.postCount} / 5 posts`,
      gradient: "from-blue-600 to-violet-500",
    },
    {
      id: "topic-starter",
      name: "Topic Starter",
      description: "Start your first discussion topic",
      icon: BookOpen,
      earned: stats.topicCount >= 1,
      progress: Math.min(stats.topicCount / 1, 1),
      progressLabel: `${stats.topicCount} / 1 topic`,
      gradient: "from-fuchsia-600 to-purple-500",
    },
    {
      id: "social-butterfly",
      name: "Social Butterfly",
      description: "Connect with 3 study partners",
      icon: Users,
      earned: stats.friendsCount >= 3,
      progress: Math.min(stats.friendsCount / 3, 1),
      progressLabel: `${stats.friendsCount} / 3 friends`,
      gradient: "from-pink-600 to-purple-500",
    },
  ];
}

function AchievementCard({ achievement }) {
  const {
    name,
    description,
    icon: Icon,
    earned,
    progress,
    progressLabel,
    gradient,
  } = achievement;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-4 transition-all",
        earned
          ? "border-purple-400/40 bg-[#241b33] shadow-lg shadow-purple-900/40"
          : "border-purple-500/15 bg-[#1c1528]/90"
      )}
    >
      {earned && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-[0.12]",
            gradient
          )}
        />
      )}
      <div className="relative flex gap-4">
        <div
          className={cn(
            "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full ring-2",
            earned
              ? cn("bg-gradient-to-br text-white ring-purple-300/50", gradient)
              : "bg-[#2a2038] text-gray-500 ring-gray-700"
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4
              className={cn(
                "font-semibold",
                earned ? "text-white" : "text-gray-300"
              )}
            >
              {name}
            </h4>
            {earned ? (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                Unlocked
              </span>
            ) : (
              <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Locked
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-300">{description}</p>
          {!earned && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[11px] text-gray-400">
                <span>Progress</span>
                <span>{progressLabel}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-600 to-violet-400 transition-all"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ProfilePage = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [isAlreadyFriend, setIsAlreadyFriend] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [profileStats, setProfileStats] = useState(null);
  const { user: authUser } = useAuth();
  const currentUsername = authUser?.username;

  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/user/profile/${username}`
      );

      setUser(response.data);
      setIsCurrentUser(response.data.username === currentUsername);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error("User not found");
        navigate("/dashboard");
      } else if (error.response?.status === 401) {
        navigate("/login");
      } else {
        toast.error("Failed to load profile");
      }
      console.error("Error fetching user profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [username, currentUsername, navigate]);

  const fetchProfileStats = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/user/profile/${username}/stats`
      );
      setProfileStats(response.data);
    } catch (error) {
      console.error("Error fetching profile stats:", error);
    }
  }, [API_URL, username]);

  const fetchFriends = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/friends/friends/${username}`);
      setFriends(response.data);
      setIsAlreadyFriend(
        response.data.some((f) => f.username === currentUsername)
      );
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  }, [API_URL, username, currentUsername]);

  const checkFriendRequestStatus = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/friends/request-status/${currentUsername}/${username}`
      );
      setFriendRequestSent(response.data.requestSent);
    } catch (error) {
      console.error("Error checking friend request status:", error);
    }
  }, [API_URL, currentUsername, username]);

  useEffect(() => {
    fetchUserProfile();
    fetchFriends();
    fetchProfileStats();
  }, [fetchUserProfile, fetchFriends, fetchProfileStats]);

  useEffect(() => {
    if (user && currentUsername && user.username !== currentUsername) {
      checkFriendRequestStatus();
    }
  }, [user, currentUsername, checkFriendRequestStatus]);

  const handleFriendRequest = async () => {
    try {
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
      await axios.post(`${API_URL}/friends/send`, { receiverId: username });
      setFriendRequestSent(true);
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const removeFriendRequest = async () => {
    try {
      await axios.post(`${API_URL}/friends/remove-request`, {
        receiverId: username,
      });
      setFriendRequestSent(false);
    } catch (error) {
      console.error("Error removing friend request:", error);
    }
  };

  const handleRemoveFriend = async () => {
    try {
      await axios.post(`${API_URL}/friends/remove-friend`, {
        friendUsername: username,
      });
      setIsAlreadyFriend(false);
      fetchFriends();
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  const handleImageUpload = async (event, imageType) => {
    if (!isCurrentUser) return;

    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, or GIF image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Maximum file size is 5MB.");
      return;
    }
    const formData = new FormData();
    formData.append(
      imageType === "profile-image" ? "profile-image" : "cover-image",
      file
    );

    try {
      setIsUploading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/user/${imageType}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
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
      toast.error("Error uploading image");

      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const openSearchDrawer = () => {
    setIsSearchDrawerOpen(true);
  };

  const closeSearchDrawer = () => {
    setIsSearchDrawerOpen(false);
  };

  const handleShareProfile = () => {
    const url = `${window.location.origin}/profile/${username}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Profile link copied"),
      () => toast.error("Could not copy link")
    );
  };

  const sidebarProps = {
    isSidebarOpen,
    closeSidebar: () => setIsSidebarOpen(false),
    openSearchDrawer,
  };

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

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : null;

  const hasInterests = user.interests?.length > 0;
  const hasCategories = user.categories?.length > 0;

  const statItems = profileStats
    ? [
        {
          label: "Study time",
          value: `${profileStats.studyHours}h`,
          icon: Clock,
        },
        {
          label: "Posts",
          value: profileStats.postCount,
          icon: MessageSquare,
        },
        {
          label: "Topics",
          value: profileStats.topicCount,
          icon: BookOpen,
        },
        {
          label: "Friends",
          value: profileStats.friendsCount,
          icon: Users,
        },
      ]
    : [];

  const achievements = profileStats ? getAchievements(profileStats) : [];
  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0f0a1f] text-white">
      <LeftSidebar {...sidebarProps} />

      <div className="flex-1 overflow-y-auto md:ml-16">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
          {/* Cover */}
          <div className="relative h-40 sm:h-48 md:h-56 rounded-xl overflow-hidden bg-[#1a1425]">
            <img
              src={resolveImageUrl(user.coverImage, "cover")}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a1f]/80 via-transparent to-black/20" />

            <Button
              variant="ghost"
              size="sm"
              className="absolute top-3 left-3 z-10 bg-black/40 hover:bg-black/60 text-white border-0 backdrop-blur-sm"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {isCurrentUser && (
              <label
                htmlFor="coverImage"
                className="absolute top-3 right-3 cursor-pointer bg-black/40 hover:bg-black/60 backdrop-blur-sm p-2 rounded-full transition-colors"
              >
                {isUploading ? (
                  <LoadingSpinner />
                ) : (
                  <Upload className="h-5 w-5 text-white" />
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

          {/* Identity row */}
          <div className="relative px-1 sm:px-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between -mt-10 sm:-mt-12 md:-mt-14">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 min-w-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-4 border-[#0f0a1f] overflow-hidden bg-[#1a1425] relative group shrink-0">
                  <img
                    src={resolveImageUrl(user.profileImage, "profile")}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {isCurrentUser && (
                    <label
                      htmlFor="profileImage"
                      className="absolute inset-0 cursor-pointer bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {isUploading ? (
                        <LoadingSpinner />
                      ) : (
                        <Upload className="h-6 w-6 text-white" />
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

                <div className="min-w-0 pb-0.5">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
                    {user.username}
                  </h1>
                  {memberSince && (
                    <p className="text-sm text-gray-300 mt-0.5">
                      Member since {memberSince}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:pb-1 shrink-0">
                {!isCurrentUser && (
                  <Button
                    size="sm"
                    className={
                      isAlreadyFriend
                        ? "border border-red-500/40 bg-red-600/90 hover:bg-red-700 hover:text-white text-white"
                        : friendRequestSent
                        ? "border border-yellow-500/40 bg-yellow-600/90 hover:bg-yellow-700 hover:text-white text-white"
                        : "border border-purple-500/40 bg-purple-600 hover:bg-purple-700 hover:text-white text-white"
                    }
                    onClick={
                      isAlreadyFriend ? handleRemoveFriend : handleFriendRequest
                    }
                  >
                    {isAlreadyFriend ? (
                      <>
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove Friend
                      </>
                    ) : friendRequestSent ? (
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
                  size="sm"
                  className="border border-purple-500/40 bg-[#1a1425] text-white shadow-sm hover:bg-[#2d2240] hover:text-white hover:border-purple-400/50"
                  onClick={handleShareProfile}
                  title="Copy profile link"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          {statItems.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {statItems.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-lg border border-purple-500/25 bg-[#1a1425] px-4 py-3"
                >
                  <div className="flex items-center gap-2 text-gray-300 text-xs mb-1">
                    <Icon className="h-3.5 w-3.5 text-purple-300" />
                    {label}
                  </div>
                  <p className="text-xl font-semibold tabular-nums text-white">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="about" className="mt-8">
            <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b border-purple-500/30 bg-transparent p-0 overflow-x-auto">
              <TabsTrigger
                value="about"
                className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 text-gray-300 shadow-none data-[state=active]:border-purple-400 data-[state=active]:bg-transparent data-[state=active]:text-white"
              >
                About
              </TabsTrigger>
              <TabsTrigger
                value="achievements"
                className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 text-gray-300 shadow-none data-[state=active]:border-purple-400 data-[state=active]:bg-transparent data-[state=active]:text-white"
              >
                Achievements
                {earnedCount > 0 && (
                  <span className="ml-1.5 text-xs text-purple-300">
                    ({earnedCount})
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="friends"
                className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 text-gray-300 shadow-none data-[state=active]:border-purple-400 data-[state=active]:bg-transparent data-[state=active]:text-white"
              >
                Friends
                {friends.length > 0 && (
                  <span className="ml-1.5 text-xs text-gray-400">
                    ({friends.length})
                  </span>
                )}
              </TabsTrigger>
              {isCurrentUser && (
                <TabsTrigger
                  value="requests"
                  className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 text-gray-300 shadow-none data-[state=active]:border-purple-400 data-[state=active]:bg-transparent data-[state=active]:text-white"
                >
                  Requests
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="about" className="mt-6">
              <Card className="border-purple-500/30 bg-[#1a1425] text-white shadow-md shadow-black/20">
                <CardContent className="p-6 space-y-6">
                  {hasInterests ? (
                    <section>
                      <h3 className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-3">
                        <Sparkles className="h-4 w-4 text-purple-300" />
                        Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {user.interests.map((interest) => (
                          <Badge
                            key={interest}
                            variant="secondary"
                            className="bg-purple-800/60 text-purple-50 border-purple-400/40 hover:bg-purple-800/80"
                          >
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {hasCategories ? (
                    <section>
                      <h3 className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-3">
                        <Tag className="h-4 w-4 text-purple-300" />
                        Forum categories
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {user.categories.map((category) => (
                          <Badge
                            key={category}
                            variant="outline"
                            className="border-purple-400/40 text-gray-100 bg-purple-900/30"
                          >
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {!hasInterests && !hasCategories && (
                    <div className="rounded-xl border border-dashed border-purple-500/35 bg-gradient-to-b from-purple-900/25 via-[#1a1425] to-[#1a1425] px-6 py-10 text-center">
                      <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-purple-900/50 ring-2 ring-purple-400/30">
                        <Sparkles className="h-7 w-7 text-purple-200" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        {isCurrentUser
                          ? "Make your profile yours"
                          : "Nothing here yet"}
                      </h3>
                      <p className="mx-auto mt-2 max-w-sm text-sm text-gray-300">
                        {isCurrentUser
                          ? "Add interests so classmates know what you study and care about."
                          : `${user.username} hasn't shared any interests yet.`}
                      </p>
                      {isCurrentUser && (
                        <Button
                          size="sm"
                          className="mt-6 border-0 bg-gradient-to-r from-purple-600 to-violet-500 px-5 text-white shadow-lg shadow-purple-600/30 hover:from-purple-500 hover:to-violet-400"
                          onClick={() =>
                            navigate("/select-interests", {
                              state: { returnTo: `/profile/${user.username}` },
                            })
                          }
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Add interests
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="mt-6">
              <Card className="border-purple-500/30 bg-[#1a1425] text-white shadow-md shadow-black/20">
                <CardContent className="p-6">
                  {profileStats ? (
                    <div className="space-y-6">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            Achievements
                          </h3>
                          <p className="mt-1 text-sm text-gray-300">
                            {earnedCount} of {achievements.length} unlocked
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">
                            {Math.round(
                              (earnedCount / achievements.length) * 100
                            )}
                            %
                          </p>
                          <p className="text-[11px] uppercase tracking-wide text-gray-400">
                            Complete
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {[...achievements]
                          .sort(
                            (a, b) => Number(b.earned) - Number(a.earned)
                          )
                          .map((achievement) => (
                            <AchievementCard
                              key={achievement.id}
                              achievement={achievement}
                            />
                          ))}
                      </div>

                      {earnedCount === 0 && (
                        <p className="text-center text-sm text-gray-400">
                          Keep studying, posting, and connecting to earn your
                          first badge.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-200 text-center py-8">
                      Loading achievements...
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="friends" className="mt-6">
              <Card className="border-purple-500/30 bg-[#1a1425] text-white shadow-md shadow-black/20">
                <CardContent className="p-6">
                  {friends.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {friends.map((friend) => (
                        <button
                          key={friend.username}
                          type="button"
                          className="flex items-center gap-3 w-full rounded-lg border border-purple-500/25 bg-[#241b33] p-4 text-left transition-colors hover:bg-[#2d2240] hover:border-purple-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                          onClick={() => navigate(`/profile/${friend.username}`)}
                        >
                          <img
                            src={resolveImageUrl(
                              friend.profileImage,
                              "profile"
                            )}
                            alt=""
                            className="w-11 h-11 rounded-full object-cover border-2 border-purple-400/60 shrink-0"
                          />
                          <span className="font-medium text-white truncate">
                            {friend.username}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <Users className="h-8 w-8 mx-auto mb-3 text-purple-400/70" />
                      <p className="text-gray-200">No friends yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {isCurrentUser && (
              <TabsContent value="requests" className="mt-6">
                <Card className="border-purple-500/30 bg-[#1a1425] text-white shadow-md shadow-black/20">
                  <CardContent className="p-6">
                    <FriendRequests />
                  </CardContent>
                </Card>
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
