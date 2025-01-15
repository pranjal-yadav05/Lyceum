import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { MessageSquare, FileQuestion } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const categories = [
  'General Discussion',
  'Study Groups',
  'Academic Help',
  'Campus Life',
  'Career Advice',
  'Events',
];

export default function TopicsList({ topics, selectedCategory, setSelectedCategory, handleTopicSelect, handleDeleteTopic, username }) {
  return (
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
        <TopicsGrid
          topics={topics}
          handleTopicSelect={handleTopicSelect}
          handleDeleteTopic={handleDeleteTopic}
          username={username}
        />
      </TabsContent>

      {categories.map((category) => (
        <TabsContent key={category} value={category} className="mt-6">
          <TopicsGrid
            topics={topics.filter((topic) => topic.category === category)}
            handleTopicSelect={handleTopicSelect}
            handleDeleteTopic={handleDeleteTopic}
            username={username}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function TopicsGrid({ topics, handleTopicSelect, handleDeleteTopic, username }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-8">
          <FileQuestion className="h-16 w-16 text-purple-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Topics Yet</h3>
          <p className="text-gray-400">Be the first to create a Topic in this category!</p>
        </div>
      ) : (
        topics.map((topic) => (
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
        ))
      )}
    </div>
  );
}

