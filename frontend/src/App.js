import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import ForumPosts from './components/ForumPosts';
import SelectInterests from './components/SelectInterests';
import RegisterPage from './components/RegisterPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsAuthenticated(true);
  }, []);

  return (
    <Router>
      <Routes>
        {!isAuthenticated ? (
          <Route path="*" element={<Navigate to="/login" replace />} />
        ) : (
          <Route path="*" element={<Navigate to="/forum" replace />} />
        )}
        <Route path="/login" element={<LoginPage setAuth={setIsAuthenticated} />} />
        <Route path='/select-interests' element={<SelectInterests />}/>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forum" element={<ForumPosts />} />
      </Routes>
    </Router>
  );
}

export default App;
