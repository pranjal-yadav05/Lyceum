import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"
import { Send } from 'lucide-react';

const ChatBox = ({ socket, roomId,userId, username }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef(null);
  
    useEffect(() => {
      socket.on('receive-message', (messageData) => {
        setMessages((prevMessages) => [...prevMessages, messageData]);
      });
  
      socket.on('room-messages', (roomMessages) => {
        setMessages(roomMessages);
      });
  
      return () => {
        socket.off('receive-message');
        socket.off('room-messages');
      };
    }, [socket]);
  
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
  
    const sendMessage = (e) => {
      e.preventDefault();
      if (inputMessage.trim() !== '') {
        socket.emit('send-message', { roomId, userId, username, message: inputMessage });
        setInputMessage('');
      }
    };
  
    return (
      <Card className="h-full flex flex-col bg-[#1a1425] border-purple-600/20">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-0">
          <ScrollArea className="h-[calc(100vh-300px)] px-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 ${
                  msg.userId === userId ? 'text-right' : 'text-left'
                }`}
              >
                <span className="text-xs text-gray-500">
                  {msg.username} - {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
                <p
                  className={`inline-block p-2 rounded-lg max-w-[80%] break-words ${
                    msg.userId === userId
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  {msg.message}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <form onSubmit={sendMessage} className="flex w-full items-center space-x-2">
            <Input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    );
  };
  
  export default ChatBox;
    