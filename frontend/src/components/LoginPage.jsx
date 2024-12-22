import React, { useState,useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google'; // Import GoogleLogin component
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.REACT_APP_API_URL;

function LoginPage({ setAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Google login handler
  const handleGoogleLoginSuccess = async (response) => {
    try {
      const token = response.credential; // Get the token returned by Google
      const decodedToken = jwtDecode(token); // Decode the JWT to get user details

      // Send the token to your backend for verification
      const res = await axios.post(`${API_URL}/auth/google`, { token });
      localStorage.setItem('token', res.data.token); // Store the JWT token
      setAuth(true); // Set the auth state
      navigate('/forum'); // Redirect to the forum
    } catch (err) {
      setError('Google login failed');
    }
  };

  // Handle Google login error
  const handleGoogleLoginError = () => {
    setError('Google login failed');
  };


  useEffect(() => {
    // Check if a token is present in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      localStorage.setItem('token', token);
      setAuth(true);
      navigate('/forum');
    }
  }, [setAuth, navigate]);

  // Regular login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', response.data.token);
      setAuth(true);
      navigate('/forum');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">Login</h1>
      
      <form onSubmit={handleLogin}>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full p-3 mt-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full p-3 mt-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Login
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 font-medium hover:underline">
            Register here
          </Link>
        </p>
      </div>

      {/* Google Login Button */}
      <div className="mt-6">
        <GoogleLogin 
          onSuccess={handleGoogleLoginSuccess} // Pass success handler
          onError={handleGoogleLoginError} // Pass error handler
        />
      </div>
    </div>
  );
}

export default LoginPage;
