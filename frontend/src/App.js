import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import ForumPosts from './components/ForumPosts';
import SelectInterests from './components/SelectInterests';
import RegisterPage from './components/RegisterPage';
import VideoChatPage from './components/VideoChatPage';
import { GoogleOAuthProvider } from '@react-oauth/google';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('token') || false);

  // Check authentication status on component mount (including refresh)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true); // User is authenticated
    }
  }, []);


  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <Router>
        <Routes>
          {/* Redirect all routes other than login/register to login page if not authenticated */}
          <Route 
            path="*" 
            element={isAuthenticated ? <Navigate to="/forum" replace /> : <Navigate to="/login" replace />} 
          />
          <Route path="/login" element={<LoginPage setAuth={setIsAuthenticated} />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route path="/select-interests" element={isAuthenticated ? <SelectInterests /> : <Navigate to="/login" replace />} />
          <Route path="/video-chat/:roomId" element={isAuthenticated ? <VideoChatPage /> : <Navigate to="/login" replace />} />
          <Route path="/forum" element={isAuthenticated ? <ForumPosts /> : <Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
