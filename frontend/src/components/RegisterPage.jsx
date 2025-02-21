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
      navigate('/welcome');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Assuming logo is placed in public/images folder
  const logoPath = "/images/lyceum-logo.png";

  return (
    <div className="min-h-screen flex flex-col md:flex-row justify-center items-center bg-gradient-to-br from-[#1a1339] via-[#2a1f5a] to-[#3a2b7a] p-4 sm:p-6 md:p-8">

      <div className="w-full md:w-1/2 flex flex-col justify-center items-center space-y-4 md:space-y-8 z-10 mb-8 md:mb-0">
        <img src={logoPath} alt="Lyceum Logo" className="w-24 h-24 md:w-48 md:h-48" />
        <div className="text-center">
          <h1 className="text-3xl md:text-6xl font-bold text-white mb-2 md:mb-4">Lyceum</h1>
          <p className="text-lg md:text-2xl text-gray-300">A Community Built for Students, by Students ❤️</p>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center z-10 mt-8 md:mt-0">
        <Card className="w-full max-w-[400px] bg-[#ffffff12] backdrop-blur-sm border-[#ffffff20] shadow-lg p-4 sm:p-6">

        <CardHeader>
          <CardTitle className="text-xl font-bold text-center text-white mb-2">Create Account</CardTitle>
          <CardDescription className="text-center text-gray-200 text-sm">Join the Lyceum community</CardDescription>

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
                  placeholder="Enter your username"
                  className="bg-[#2a2435] border-purple-600/20 text-white"
                  autoComplete="username"
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
                  autoComplete="email"
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
                  autoComplete="new-password"
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
                  autoComplete="new-password"
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
    </div>
  );
}

export default RegisterPage;
