import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button } from "./ui/button";
import { X, Info, Send, Edit, Reply, Smile } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import EmojiPicker from "emoji-picker-react";
import ScrollToBottom from "react-scroll-to-bottom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

export default function PostsView({ topicId, username, onClose }) {
  const [posts, setPosts] = useState([]);
  const [topic, setTopic] = useState(null);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [replyingToId, setReplyingToId] = useState(null);
  const scrollAreaRef = useRef(null);
  const textareaRef = useRef(null);
  const scrollViewportRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTopic();
    fetchPosts();
  }, [topicId]);

  // Scroll to bottom when loading completes and when posts update
  //   useEffect(() => {
  //     if (!isLoadingPosts && scrollViewportRef.current) {
  //       const viewport = scrollViewportRef.current;

  //       // Check if the user is already near the bottom
  //       const isNearBottom =
  //         viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 100;

  //       if (isNearBottom) {
  //         viewport.scrollTo({
  //           top: viewport.scrollHeight,
  //           behavior: 'smooth',
  //         });
  //       }
  //     }
  //   }, [isLoadingPosts, posts]);

  const fetchTopic = async () => {
    try {
      const response = await axios.get(`${API_URL}/topics/${topicId}`, {
        withCredentials: true,
      });
      setTopic(response.data);
    } catch (error) {
      console.error("Error fetching topic:", error);
    }
  };

  const fetchPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const response = await axios.get(`${API_URL}/topics/${topicId}/posts`, {
        withCredentials: true,
      });
      const postsData = response.data;

      const postsWithProfileImages = await Promise.all(
        postsData.map(async (post) => {
          try {
            const userResponse = await axios.get(
              `${API_URL}/user/profile/${post.author}`,
              {
                withCredentials: true,
              }
            );
            return {
              ...post,
              profileImage: userResponse.data.profileImage || null,
              coverImage: userResponse.data.coverImage || null,
            };
          } catch (error) {
            console.error(
              `Error fetching user data for ${post.author}:`,
              error
            );
            return post;
          }
        })
      );

      setPosts(postsWithProfileImages);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      await axios.post(
        `${API_URL}/topics/${topicId}/posts`,
        {
          content: newPostContent,
          author: username,
          replyTo: replyingToId,
        },
        {
          withCredentials: true,
        }
      );
      setNewPostContent("");
      setReplyingToId(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      await fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!postId) {
      console.error("Invalid post ID");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_URL}/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error.message);
    }
  };

  const handleEditPost = async (postId) => {
    const token = localStorage.getItem("token");
    if (!editContent.trim()) return;
    try {
      await axios.patch(
        `${API_URL}/posts/${postId}`,
        { content: editContent },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setEditingPostId(null);
      setEditContent("");
      await fetchPosts();
    } catch (error) {
      console.error("Error editing post:", error);
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setNewPostContent((prevContent) => prevContent + emojiObject.emoji);
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  };

  const renderPostContent = (content) => {
    return content.split("\n").map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split("\n").length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const adjustTextareaHeight = (textarea) => {
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gray-800">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={onClose} className="mr-2">
            <X className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-semibold">{topic?.title}</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsInfoOpen(true)}>
          <Info className="h-5 w-5" />
        </Button>
      </div>

      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent className="mx-auto max-w-lg w-[calc(100%-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle>{topic?.title}</DialogTitle>
            <DialogDescription className="mt-2">
              {topic?.description}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <ScrollArea className="flex-grow" ref={scrollAreaRef}>
        {isLoadingPosts ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {posts.map((post) => (
              <div
                key={post._id}
                style={{
                  backgroundImage: `linear-gradient(rgba(26, 20, 37, 0.8), rgba(26, 20, 37, 0.8)), url(${post.coverImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                className={`p-4 rounded-lg ${
                  post.author === username
                    ? "bg-purple-900 ml-auto"
                    : "bg-gray-800 mr-auto"
                } max-w-[80%]`}
              >
                <div className="flex items-start mb-2">
                  <Avatar
                    className="w-8 h-8 mr-2 cursor-pointer"
                    onClick={() => navigate(`/profile/${post.author}`)}
                  >
                    {post.profileImage ? (
                      <AvatarImage src={post.profileImage} alt={post.author} />
                    ) : (
                      <AvatarFallback className="text-black">
                        {post.author.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-grow">
                    <div className="flex justify-between items-center">
                      <span
                        className="font-semibold cursor-pointer"
                        onClick={() => navigate(`/profile/${post.author}`)}
                      >
                        {post.author}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(post.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {post.replyTo && (
                      <div className="text-xs text-gray-400 mt-1">
                        Replying to:{" "}
                        {posts.find((p) => p._id === post.replyTo)?.author}
                      </div>
                    )}
                  </div>
                </div>
                {editingPostId === post._id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleEditPost(post._id);
                    }}
                  >
                    <Textarea
                      value={editContent}
                      onChange={(e) => {
                        setEditContent(e.target.value);
                        adjustTextareaHeight(e.target);
                      }}
                      className="mb-2 text-black min-h-[60px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleEditPost(post._id);
                        }
                      }}
                    />
                    <Button type="submit" size="sm" className="mr-2">
                      Save
                    </Button>
                    <Button
                      onClick={() => setEditingPostId(null)}
                      size="sm"
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <p className="whitespace-pre-line">
                    {renderPostContent(post.content)}
                  </p>
                )}
                <div className="mt-2 space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyingToId(post._id);
                      setNewPostContent(`@${post.author} `);
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                      }
                    }}
                  >
                    <Reply className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                  {post.author === username && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPostId(post._id);
                          setEditContent(post.content);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePost(post._id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <form
        onSubmit={handleCreatePost}
        className="flex-shrink-0 p-4 bg-gray-800 flex items-center space-x-2"
      >
        <Textarea
          ref={textareaRef}
          placeholder={
            replyingToId ? "Type your reply..." : "Type a message..."
          }
          value={newPostContent}
          onChange={(e) => {
            setNewPostContent(e.target.value);
            adjustTextareaHeight(e.target);
          }}
          className="flex-1 text-black min-h-[40px] max-h-[200px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleCreatePost(e);
            }
          }}
          rows={1}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </PopoverContent>
        </Popover>
        <Button type="submit" size="sm">
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
