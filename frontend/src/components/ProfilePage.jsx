import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Share2, Edit2, Clock, Users, Flame, ArrowLeft } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const username = sessionStorage.getItem('username') || 'User';
  
  const interests = [
    { icon: "🎵", label: "Lofi" },
    { icon: "🎤", label: "Taylor Swift" },
    { icon: "✈️", label: "Travel" },
    { icon: "🏊‍♂️", label: "Swimming" },
    { icon: "🚴‍♂️", label: "Cycling" },
    { icon: "🏃‍♂️", label: "Running" },
    { icon: "📚", label: "Fiction" },
    { icon: "⚡", label: "Harry Potter" }
  ];

  return (
    <div className="min-h-screen bg-[#0f0a1f] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="outline"
          className="mb-4 bg-purple-600 hover:bg-purple-700"
          onClick={() => navigate('/welcome')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="relative mb-8">
          <div className="h-48 md:h-64 rounded-lg overflow-hidden">
            <img
              src="/placeholder.svg?height=256&width=1024"
              alt="Profile cover"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-0 left-4 transform translate-y-1/2 flex items-end">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#0f0a1f] overflow-hidden bg-[#1a1425]">
              <img
                src="/placeholder.svg?height=128&width=128"
                alt="Profile picture"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="ml-4 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold">{username}</h1>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <span>📚 College</span>
                <span>•</span>
                <span>⚙️ Engineering</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button variant="outline" size="icon" className="bg-purple-600 hover:bg-purple-700">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="bg-purple-600 hover:bg-purple-700">
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="info" className="mt-16">
          <TabsList className="bg-[#1a1425] border-purple-600/20 w-full justify-start overflow-x-auto">
            <TabsTrigger value="info" className="data-[state=active]:bg-purple-600">
              User Info
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-purple-600">
              Achievements
            </TabsTrigger>
            <TabsTrigger value="friends" className="data-[state=active]:bg-purple-600">
              Friends
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-purple-600">
              Friend Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-[#1a1425] border-purple-600/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-400" />
                    <h3 className="text-lg font-semibold">Friends</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-400 mt-2">2</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1425] border-purple-600/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-400" />
                    <h3 className="text-lg font-semibold">Focus Time</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-400 mt-2">0h</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1425] border-purple-600/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-purple-400" />
                    <h3 className="text-lg font-semibold">Study Streak</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-400 mt-2">0</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[#1a1425] border-purple-600/20">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-purple-600/20 text-purple-100 hover:bg-purple-600/30"
                    >
                      {interest.icon} {interest.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1425] border-purple-600/20">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">About Me</h3>
                <p className="text-gray-400">
                  Click here to fill it in.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <Card className="bg-[#1a1425] border-purple-600/20 mt-6">
              <CardContent className="pt-6">
                <p className="text-gray-400">No achievements yet. Start participating to earn some!</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="friends">
            <Card className="bg-[#1a1425] border-purple-600/20 mt-6">
              <CardContent className="pt-6">
                <p className="text-gray-400">You have 2 friends.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card className="bg-[#1a1425] border-purple-600/20 mt-6">
              <CardContent className="pt-6">
                <p className="text-gray-400">No pending friend requests.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;

