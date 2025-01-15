import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import LoadingSpinner from './LoadingSpinner';

const categories = [
  'General Discussion',
  'Study Groups',
  'Academic Help',
  'Campus Life',
  'Career Advice',
  'Events',
];

export default function CreateTopicDialog({ isOpen, onOpenChange, onCreateTopic, username }) {
  const [newTopic, setNewTopic] = useState({
    title: '',
    description: '',
    category: '',
    author: username
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTopic = async () => {
    if (!newTopic.title || !newTopic.description || !newTopic.category) {
      alert('Please fill in all fields');
      return;
    }
    setIsCreating(true);
    await onCreateTopic(newTopic);
    setIsCreating(false);
    setNewTopic({ title: '', description: '', category: '', author: username });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="mr-2 h-4 w-4" />
          New Topic
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1425] text-white">
        <DialogHeader>
          <DialogTitle>Create New Topic</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a new discussion topic for others to join.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 my-4">
          <Input
            placeholder="Topic title"
            value={newTopic.title}
            onChange={(e) => setNewTopic({...newTopic, title: e.target.value})}
            className="bg-[#2a2435] border-purple-600/20"
          />
          <Textarea
            placeholder="Topic description"
            value={newTopic.description}
            onChange={(e) => setNewTopic({...newTopic, description: e.target.value})}
            className="bg-[#2a2435] border-purple-600/20"
          />
          <Select
            value={newTopic.category}
            onValueChange={(value) => setNewTopic({...newTopic, category: value})}
          >
            <SelectTrigger className="bg-[#2a2435] border-purple-600/20">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2435]">
              <SelectGroup>
                <SelectLabel>Categories</SelectLabel>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={handleCreateTopic}
            disabled={isCreating}
          >
           {isCreating ? <LoadingSpinner /> : 'Create Topic'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

