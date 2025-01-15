import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { FileQuestion } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function PostsList({ posts, handleDeletePost, username }) {
  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-8">
          <FileQuestion className="h-16 w-16 text-purple-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
          <p className="text-gray-400">Be the first to share your thoughts!</p>
        </div>
      ) : (
        posts.map((post) => (
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
                {username === post.author && (
                  <Button 
                    variant="ghost" 
                    className="text-red-500 hover:text-red-400 bg-transparent border border-red-500 hover:border-red-400 rounded-full px-2 py-1 text-xs transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePost(post._id);
                    }}
                  >
                    Delete Post
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none text-white">
                <ReactMarkdown>{post.content}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

