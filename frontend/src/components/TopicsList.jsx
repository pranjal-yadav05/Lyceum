import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { MessageSquare, FileQuestion, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import CreateTopicDialog from "./CreateTopicDialog";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const categories = [
  "General Discussion",
  "Study Groups",
  "Academic Help",
  "Campus Life",
  "Career Advice",
  "Events",
];

export default function TopicsList({
  topics,
  selectedCategory,
  setSelectedCategory,
  handleTopicSelect,
  handleDeleteTopic,
  username,
  selectedTopic,
  handleCreateTopic,
}) {
  const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false);
  const [topicsWithImages, setTopicsWithImages] = useState([]);

  useEffect(() => {
    const fetchTopicsWithAuthorImages = async () => {
      const updatedTopics = await Promise.all(
        topics.map(async (topic) => {
          try {
            const authorResponse = await axios.get(
              `${API_URL}/user/profile/${topic.author}`
            );
            return {
              ...topic,
              authorCoverImage: authorResponse.data.coverImage || null,
            };
          } catch (error) {
            console.error(
              `Error fetching cover image for author ${topic.author}:`,
              error
            );
            return topic;
          }
        })
      );
      setTopicsWithImages(updatedTopics);
    };

    fetchTopicsWithAuthorImages();
  }, [topics]);

  return (
    <div className="flex flex-col h-full min-h-screen px-0 pb-3">
      <div className="flex justify-center items-center mb-4 gap-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-auto bg-[#1a1425] border-purple-600/20">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1425]">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="bg-purple-600 hover:bg-purple-700 ml-2"
          onClick={() => setIsCreateTopicOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Topic
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {topicsWithImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <FileQuestion className="h-12 w-12 text-purple-400 mb-2" />
            <h3 className="text-lg font-semibold mb-1">No Topics Yet</h3>
            <p className="text-gray-400 text-sm">
              Be the first to create a Topic!
            </p>
          </div>
        ) : (
          topicsWithImages
            .filter(
              (topic) =>
                selectedCategory === "all" ||
                topic.category === selectedCategory
            )
            .map((topic) => (
              <div
                key={topic._id}
                className={`p-4 rounded-lg cursor-pointer transition-transform duration-300 shadow-md relative overflow-hidden aspect-square border border-transparent bg-[#1a1425] hover:scale-105 hover:shadow-lg ${
                  selectedTopic === topic._id
                    ? "bg-purple-700"
                    : "bg-[#1a1425] hover:bg-[#2a2435]"
                }`}
                onClick={() => handleTopicSelect(topic._id)}
                style={{
                  backgroundImage: topic.authorCoverImage
                    ? `linear-gradient(rgba(26, 20, 37, 0.8), rgba(26, 20, 37, 0.8)), url(${topic.authorCoverImage})`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="flex flex-col h-full relative z-10">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {topic.title}
                      </h3>
                      <span className="text-xs text-purple-400">
                        {topic.category}
                      </span>
                    </div>
                    {username === topic.author && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-400 bg-transparent p-1 h-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTopic(topic._id);
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                    {topic.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{topic.postsCount || 0}</span>
                    </div>
                    <span className="truncate ml-2">{topic.author}</span>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      <CreateTopicDialog
        isOpen={isCreateTopicOpen}
        onOpenChange={setIsCreateTopicOpen}
        onCreateTopic={handleCreateTopic}
        username={username}
      />
    </div>
  );
}
