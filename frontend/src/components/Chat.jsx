import React, { useState, useEffect, useRef } from 'react';
import { getConversation, sendMessage } from '../services/messageService';

const Chat = ({ selectedUserId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedUserId) {
        const data = await getConversation(selectedUserId);
        setMessages(data);
        scrollToBottom();
      }
    };
    fetchMessages();
  }, [selectedUserId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message = await sendMessage(selectedUserId, newMessage);
      setMessages([...messages, message]);
      setNewMessage('');
      scrollToBottom();
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(message => (
          <div
            key={message._id}
            className={`message ${message.sender._id === selectedUserId ? 'received' : 'sent'}`}
          >
            <p>{message.content}</p>
            <small>{new Date(message.createdAt).toLocaleString()}</small>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chat;