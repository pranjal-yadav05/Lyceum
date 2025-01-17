import React from 'react';
import { Button } from "./ui/button";
import { MessageSquare, FileQuestion } from 'lucide-react';
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const categories = [
  'General Discussion',
  'Study Groups',
  'Academic Help',
  'Campus Life',
  'Career Advice',
  'Events',
];

export default function TopicsList({ topics, selectedCategory, setSelectedCategory, handleTopicSelect, handleDeleteTopic, username, selectedTopic }) {
  return (
    <div className="flex flex-col h-full">
      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="w-full bg-[#1a1425] border-purple-600/20 mb-4">
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

      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {topics.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <FileQuestion className="h-12 w-12 text-purple-400 mb-2" />
              <h3 className="text-lg font-semibold mb-1">No Topics Yet</h3>
              <p className="text-gray-400 text-sm">Be the first to create a Topic!</p>
            </div>
          ) : (
            topics
              .filter(topic => selectedCategory === 'all' || topic.category === selectedCategory)
              .map((topic) => (
                <div 
                  key={topic._id} 
                  className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                    selectedTopic === topic._id ? 'bg-purple-700' : 'bg-[#1a1425] hover:bg-[#2a2435]'
                  }`}
                  onClick={() => handleTopicSelect(topic._id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{topic.title}</h3>
                      <span className="text-xs text-purple-400">{topic.category}</span>
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
                  <p className="text-gray-400 text-xs mb-2 line-clamp-2">{topic.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{topic.postsCount || 0}</span>
                    </div>
                    <span className="truncate ml-2">{topic.author}</span>
                  </div>
                </div>
              ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

