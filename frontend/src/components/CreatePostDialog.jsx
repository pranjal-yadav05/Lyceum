import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Plus, Bold, Italic, List, LinkIcon, ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import LoadingSpinner from './LoadingSpinner';

export default function CreatePostDialog({ isOpen, onOpenChange, onCreatePost, username }) {
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    author: username
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content) {
      alert('Please fill in all fields');
      return;
    }
    setIsCreating(true);
    await onCreatePost(newPost);
    setIsCreating(false);
    setNewPost({ title: '', content: '', author: username });
  };

  const applyStyle = (style) => {
    const textarea = document.getElementById('post-content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let styledText = '';
    let cursorOffset = 0;

    switch (style) {
      case 'bold':
        styledText = `**${selectedText}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        styledText = `*${selectedText}*`;
        cursorOffset = 1;
        break;
      case 'list':
        styledText = `\n- ${selectedText}`;
        break;
      case 'link':
        styledText = `[${selectedText}](url)`;
        break;
      case 'image':
        styledText = `![${selectedText}](image_url)`;
        break;
      default:
        styledText = selectedText;
    }

    const newContent = textarea.value.substring(0, start) + styledText + textarea.value.substring(end);
    setNewPost({ ...newPost, content: newContent });
    textarea.focus();
    textarea.setSelectionRange(start + styledText.length + cursorOffset, start + styledText.length + cursorOffset);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1425] text-white">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          <Input
            placeholder="Post title"
            value={newPost.title}
            onChange={(e) => setNewPost({...newPost, title: e.target.value})}
            className="bg-[#2a2435] border-purple-600/20"
          />
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => applyStyle('bold')}>
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => applyStyle('italic')}>
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => applyStyle('list')}>
                <List className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => applyStyle('link')}>
                <LinkIcon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => applyStyle('image')}>
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
          </div>
          {showPreview ? (
            <div className="bg-[#2a2435] border-purple-600/20 rounded-md p-4 prose prose-invert max-w-none min-h-[200px]">
              <ReactMarkdown>{newPost.content}</ReactMarkdown>
            </div>
          ) : (
            <Textarea
              id="post-content"
              placeholder="Write your post content..."
              value={newPost.content}
              onChange={(e) => setNewPost({...newPost, content: e.target.value})}
              className="bg-[#2a2435] border-purple-600/20 min-h-[200px] whitespace-pre-wrap"
            />
          )}
        </div>
        <DialogFooter>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={handleCreatePost}
            disabled={isCreating}
          >
            {isCreating ? <LoadingSpinner /> : 'Create Post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

