import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import ForumPosts from './components/ForumPosts';
import SelectInterests from './components/SelectInterests';
import RegisterPage from './components/RegisterPage';
import VideoChatPage from './components/VideoChatPage';
import { GoogleOAuthProvider } from '@react-oauth/google';
import WelcomePage from './components/WelcomePage';
import ProfilePage from './components/ProfilePage';
import { jwtDecode } from 'jwt-decode';
import ChatPage from './components/ChatPage';
import BlobManager from './components/BlobManager';
import { Toaster } from 'react-hot-toast';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          setUsername(decodedToken.username || '');
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error decoding token:', error);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUsername('');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem('token', token);

    try {
      const decodedToken = jwtDecode(token);
      setUsername(decodedToken.username || '');
      setIsAuthenticated(true);
      localStorage.setItem('username',decodedToken.username);
      localStorage.setItem('userId',decodedToken.id)
      localStorage.setItem('token', token);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>; // Or replace with a proper loading spinner
  }

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage setAuth={setIsAuthenticated} onLoginSuccess={handleLogin} />} />
          <Route path="/register" element={<RegisterPage onLoginSuccess={handleLogin} />} />
          
          {/* Protected Routes */}
          <Route path='/chat-list' element={isAuthenticated ? <ChatPage /> : <Navigate to='/login' replace />} />
          <Route path="/select-interests" element={isAuthenticated ? <SelectInterests /> : <Navigate to="/login" replace />} />
          <Route path="/video-chat/:roomId" element={isAuthenticated ? <VideoChatPage username={username} setUsername={setUsername} /> : <Navigate to="/login" replace />} />
          <Route path="/forum" element={isAuthenticated ? <ForumPosts username={username} setUsername={setUsername} /> : <Navigate to="/login" replace />} />
          {/* <Route path="/profile" element={isAuthenticated ? <ProfilePage username={username} setUsername={setUsername}/> : <Navigate to="/login" replace />}/> */}
          <Route 
            path="/profile/:username" 
            element={isAuthenticated ? <ProfilePage username={username} setUsername={setUsername}/> : <Navigate to="/login" replace />}
          />
          <Route path="/blob" element={<BlobManager/>} />
       
          <Route path="/welcome" element={isAuthenticated ? <WelcomePage username={username} setUsername={setUsername}/> : <Navigate to="/login" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </GoogleOAuthProvider>
  );
}

export default App;
