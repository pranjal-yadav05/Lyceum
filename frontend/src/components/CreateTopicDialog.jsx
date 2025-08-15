import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import LoadingSpinner from "./LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

const categories = [
  "General Discussion",
  "Study Groups",
  "Academic Help",
  "Campus Life",
  "Career Advice",
  "Events",
];

export default function CreateTopicDialog({
  isOpen,
  onOpenChange,
  onCreateTopic,
  username,
}) {
  const [newTopic, setNewTopic] = useState({
    title: "",
    description: "",
    category: "",
    author: username,
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTopic = async () => {
    if (!newTopic.title || !newTopic.description || !newTopic.category) {
      alert("Please fill in all fields");
      return;
    }
    setIsCreating(true);
    await onCreateTopic(newTopic);
    setIsCreating(false);
    setNewTopic({ title: "", description: "", category: "", author: username });
  };

  return (
    isOpen && (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-md"
          aria-hidden="true"
        ></div>
        <DialogContent className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl max-w-md w-full rounded-2xl text-center">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              Create New Topic
            </DialogTitle>
            <DialogDescription className="mt-3 text-md text-gray-200 leading-relaxed">
              Create a new discussion topic for others to join.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <Input
              placeholder="Topic title"
              value={newTopic.title}
              onChange={(e) =>
                setNewTopic({ ...newTopic, title: e.target.value })
              }
              className="w-full bg-[#2a2435] border-purple-600/20 text-white"
            />
            <Textarea
              placeholder="Topic description"
              value={newTopic.description}
              onChange={(e) =>
                setNewTopic({ ...newTopic, description: e.target.value })
              }
              className="w-full bg-[#2a2435] border-purple-600/20 text-white"
            />
            <Select
              value={newTopic.category}
              onValueChange={(value) =>
                setNewTopic({ ...newTopic, category: value })
              }
            >
              <SelectTrigger className="w-full bg-[#2a2435] border-purple-600/20 text-white">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2435]">
                <SelectGroup>
                  <SelectLabel className="text-gray-400">
                    Categories
                  </SelectLabel>
                  {categories.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                      className="text-white"
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-4">
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg shadow-lg"
              onClick={handleCreateTopic}
              disabled={isCreating}
            >
              {isCreating ? <LoadingSpinner /> : "Create Topic"}
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg shadow-lg"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  );
}
