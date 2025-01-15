import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Check, X } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

const FriendRequests = () => {
    const [friendRequests, setFriendRequests] = useState([]);
    const currentUsername = sessionStorage.getItem('username');
  
    useEffect(() => {
      fetchFriendRequests();
    }, []);
  
    const fetchFriendRequests = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          return;
        }
  
        const response = await axios.get(`${API_URL}/friends/requests/${currentUsername}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setFriendRequests(response.data);
      } catch (error) {
        console.error('Error fetching friend requests:', error);
      }
    };
  
    const handleAcceptRequest = async (senderUsername) => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          return;
        }
  
        await axios.post(`${API_URL}/friends/accept`, {
          senderId: senderUsername,
          receiverId: currentUsername
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchFriendRequests();
      } catch (error) {
        console.error('Error accepting friend request:', error);
      }
    };
  
    const handleDeclineRequest = async (senderUsername) => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          return;
        }
  
        await axios.post(`${API_URL}/friends/decline`, {
          senderId: senderUsername,
          receiverId: currentUsername
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchFriendRequests();
      } catch (error) {
        console.error('Error declining friend request:', error);
      }
    };
    
    const getImageUrl = (imagePath) => {
      if (!imagePath) return '';
      const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
      return `${process.env.REACT_APP_BACKEND_URL}/${cleanPath}`;
    };

    return (
      <div>
        <h3 className="text-xl font-semibold mb-4">Friend Requests</h3>
        {friendRequests.length === 0 ? (
          <p>No friend requests at the moment.</p>
        ) : (
          <div className="space-y-4">
            {friendRequests.map((request) => (
            <Card key={request._id} className="bg-[#1a1425] border-purple-600/20">
                <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center">
                    <img
                    src={`${getImageUrl(request.senderProfile.profileImage)}`}
                    alt={request.sender}
                    className="w-10 h-10 rounded-full object-cover mr-4"
                    />
                    <span className='text-white'>{request.sender}</span>
                </div>
                <div className="flex space-x-2">
                    <Button
                    variant="outline"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleAcceptRequest(request.sender)}
                    >
                    <Check className="h-4 w-4 mr-2" />
                    Accept
                    </Button>
                    <Button
                    variant="outline"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
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