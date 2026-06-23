import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Check, X } from 'lucide-react';
import { resolveImageUrl } from "../lib/imageUrl";
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL;

const FriendRequests = () => {
    const [friendRequests, setFriendRequests] = useState([]);
    const { user } = useAuth();
    const currentUsername = user?.username;

    const fetchFriendRequests = useCallback(async () => {
      try {
        const response = await axios.get(`${API_URL}/friends/requests/${currentUsername}`);
        setFriendRequests(response.data);
      } catch (error) {
        console.error('Error fetching friend requests:', error);
      }
    }, [currentUsername]);

    useEffect(() => {
      if (currentUsername) fetchFriendRequests();
    }, [currentUsername, fetchFriendRequests]);

    const handleAcceptRequest = async (senderUsername) => {
      try {
        await axios.post(`${API_URL}/friends/accept`, { senderId: senderUsername });
        fetchFriendRequests();
      } catch (error) {
        console.error('Error accepting friend request:', error);
      }
    };

    const handleDeclineRequest = async (senderUsername) => {
      try {
        await axios.post(`${API_URL}/friends/decline`, { senderId: senderUsername });
        fetchFriendRequests();
      } catch (error) {
        console.error('Error declining friend request:', error);
      }
    };
    
    const getImageUrl = (imagePath) => resolveImageUrl(imagePath, "profile");

    return (
      <div className="text-white">
        <h3 className="text-xl font-semibold mb-4 text-white">Friend Requests</h3>
        {friendRequests.length === 0 ? (
          <p className="text-gray-200">No friend requests at the moment.</p>
        ) : (
          <div className="space-y-4">
            {friendRequests.map((request) => (
            <Card key={request._id} className="bg-[#241b33] border-purple-500/25 text-white">
                <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center">
                    <img
                    src={`${getImageUrl(request.senderProfile.profileImage)}`}
                    alt={request.sender}
                    className="w-10 h-10 rounded-full object-cover mr-4 border border-purple-400/40"
                    />
                    <span className="text-white font-medium">{request.sender}</span>
                </div>
                <div className="flex space-x-2">
                    <Button
                    variant="outline"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white border-green-500/40"
                    onClick={() => handleAcceptRequest(request.sender)}
                    >
                    <Check className="h-4 w-4 mr-2" />
                    Accept
                    </Button>
                    <Button
                    variant="outline"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white border-red-500/40"
                    onClick={() => handleDeclineRequest(request.sender)}
                    >
                    <X className="h-4 w-4 mr-2" />
                    Decline
                    </Button>
                </div>
                </CardContent>
            </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  export default FriendRequests