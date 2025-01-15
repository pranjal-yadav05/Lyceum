import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { X, Search } from 'lucide-react';

const SearchDrawer = ({ isOpen, onClose, API_URL }) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure the drawer animation has started
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        fetchSearchResults();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchSearchResults = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/user`, {
        params: { query: query.trim() },
        withCredentials: true,
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
    onClose();
  };

  const getImageUrl = (imageUrl, type) => {
    if (imageUrl) return imageUrl;
    return type === 'profile' ? '/images/defaultProfile.jpg' : '/images/defaultCover.jpg';
  };


  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-[#1a1425] shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Search Users</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6 text-gray-400" />
          </Button>
        </div>
        <div className="relative mb-4">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#2a2435] text-white border-purple-600/20 pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500" />
        </div>
        {isLoading && <p className="text-gray-400 text-sm">Searching...</p>}
        {searchResults.length > 0 && !isLoading && (
          <div className="flex-grow overflow-y-auto">
            <ul className="space-y-2">
              {searchResults.map((user) => (
                <li
                  key={user.username}
                  className="flex items-center p-2 hover:bg-purple-600/20 rounded-lg cursor-pointer transition-colors relative overflow-hidden h-16"
                  onClick={() => handleUserClick(user.username)}
                  style={{
                    backgroundImage: `linear-gradient(rgba(26, 20, 37, 0.8), rgba(26, 20, 37, 0.8)), url(${getImageUrl(user.coverImage, 'cover')})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="relative z-10 flex items-center">
                    <img 
                      className="h-8 w-8 mr-3 rounded-lg" 
                      src={getImageUrl(user.profileImage, 'profile')}
                      alt={user.username}
                    />
                    <span className="text-white">{user.username}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!isLoading && query.trim() && searchResults.length === 0 && (
          <p className="text-sm text-gray-400 mt-4">No results found for "{query}"</p>
        )}
      </div>
    </div>
  );
};

export default SearchDrawer;

