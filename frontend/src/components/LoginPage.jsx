import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import LoadingSpinner from './LoadingSpinner';

const API_URL = process.env.REACT_APP_API_URL;

function LoginPage({ setAuth, onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLoginSuccess = async (response) => {
    setIsLoading(true);
    try {
      const token = response.credential;
      const res = await axios.post(`${API_URL}/auth/google`, { token });
      onLoginSuccess(res.data.token);
      setAuth(true);
      navigate('/welcome');
    } catch (err) {
      setError('Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginError = () => {
    setError('Google login failed');
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      localStorage.setItem('token', token);
      onLoginSuccess(token)
      setAuth(true);
      navigate('/welcome');
    }
  }, [setAuth, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { identifier, password });
      onLoginSuccess(response.data.token)
      setAuth(true);
      navigate('/welcome');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0a1f] p-4">
      <Card className="w-full max-w-md bg-[#1a1425] border-purple-600/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-white">Login</CardTitle>
          <CardDescription className="text-center text-gray-400">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-white">Username or Email</Label>
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your Username or Email"
                  className="bg-[#2a2435] border-purple-600/20 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-[#2a2435] border-purple-600/20 text-white"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full mt-6 bg-purple-600 hover:bg-purple-700">
              {isLoading ? <LoadingSpinner /> : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-sm text-gray-400 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-purple-400 font-medium hover:underline">
              Register here
            </Link>
          </p>
          <div className="w-full">
            <GoogleLogin 
              onSuccess={handleGoogleLoginSuccess}
              onError={handleGoogleLoginError}
              theme="filled_black"
              size="large"
              width="100%"
            />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default LoginPage;

