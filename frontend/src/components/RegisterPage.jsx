import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import LoadingSpinner from './LoadingSpinner';

const API_URL = process.env.REACT_APP_API_URL;

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true)

    if (password !== confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/register`, { username, email, password });
      localStorage.setItem('token', response.data.token);
      navigate('/select-interests');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally{
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0a1f] p-4">
      <Card className="w-full max-w-md bg-[#1a1425] border-purple-600/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-white">Register</CardTitle>
          <CardDescription className="text-center text-gray-400">Create a new account to join our community</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister}>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Username"
                  className="bg-[#2a2435] border-purple-600/20 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="bg-[#2a2435] border-purple-600/20 text-white"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full mt-6 bg-purple-600 hover:bg-purple-700">
              {isLoading ? <LoadingSpinner /> : 'Register'}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-400 text-center w-full">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 font-medium hover:underline">
              Login here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default RegisterPage;

