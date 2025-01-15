import React, { useState, useEffect } from 'react';
import { getConversations } from '../services/messageService';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MessageSquare } from 'lucide-react';

const ConversationList = ({ onSelectConversation }) => {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const fetchConversations = async () => {
      const data = await getConversations();
      setConversations(data);
    };
    fetchConversations();
  }, []);

  return (
    <Card className="bg-[#1a1425] border-purple-600/20">
      <CardHeader>
        <CardTitle className="text-xl text-white flex items-center">
          <MessageSquare className="mr-2 h-5 w-5 flex-shrink-0" />
          <span className="truncate">Messages</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {conversations.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No conversations yet</p>
          ) : (
            conversations.map(conv => (
              <div
                key={conv._id}
                className="p-3 rounded-lg hover:bg-[#2a2435] cursor-pointer transition-colors duration-200 border border-purple-600/20"
                onClick={() => onSelectConversation(conv._id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-white font-medium">
                    {conv.lastMessage.sender.username}
                  </h3>
                  <small className="text-gray-400 text-xs">
                    {new Date(conv.lastMessage.createdAt).toLocaleString()}
                  </small>
                </div>
                <p className="text-gray-400 text-sm line-clamp-1">
                  {conv.lastMessage.content}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationList;