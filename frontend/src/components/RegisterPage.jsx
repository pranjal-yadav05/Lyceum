import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import LoadingSpinner from "./LoadingSpinner";
import ErrorAlert from "./ErrorAlert";

const API_URL = process.env.REACT_APP_API_URL;

function RegisterPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLoginSuccess = async (response) => {
    setIsLoading(true);
    try {
      const token = response.credential;
      const res = await axios.post(`${API_URL}/auth/google`, { token });
      localStorage.setItem("token", res.data.token);
      if (onLoginSuccess) {
        onLoginSuccess(res.data.token); // Update authentication state
      }
      navigate("/welcome");
    } catch (err) {
      setError("Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginError = () => {
    setError("Google login failed");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords don't match!");
      setIsLoading(false);
      return;
    }

    // Clear any existing token before registration
    localStorage.removeItem("token");

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password,
      });
      // Only store token after successful registration
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        if (onLoginSuccess) {
          onLoginSuccess(response.data.token); // Update authentication state
        }
        navigate("/welcome");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logoPath = "/images/lyceum-logo.png";

  return (
    <div className="min-h-screen flex flex-col md:flex-row justify-center items-center bg-gradient-to-br from-[#1a1339] via-[#2a1f5a] to-[#3a2b7a] p-4 sm:p-6 md:p-8">
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center space-y-4 md:space-y-8 z-10 mb-8 md:mb-0">
        <img
          src={logoPath}
          alt="Lyceum Logo"
          className="w-24 h-24 md:w-48 md:h-48"
        />
        <div className="text-center">
          <h1 className="text-3xl md:text-6xl font-bold text-white mb-2 md:mb-4">
            Lyceum
          </h1>
          <p className="text-lg md:text-2xl text-gray-300">
            A Community Built for Students, by Students ❤️
          </p>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center z-10 mt-8 md:mt-0">
        <Card className="w-full max-w-[400px] bg-[#ffffff12] backdrop-blur-sm border-[#ffffff20] shadow-lg p-4 sm:p-6">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center text-white">
              Create Account
            </CardTitle>
            <CardDescription className="text-center text-gray-300 text-sm">
              Join the Lyceum community
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-6">
              <ErrorAlert message={error} />

              <div className="space-y-4">
                <div>
                  <Label htmlFor="username" className="text-gray-200">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="bg-[#2a2435] border border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500"
                    autoComplete="username"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-200">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-[#2a2435] border border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500"
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-gray-200">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="bg-[#2a2435] border border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-gray-200">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="bg-[#2a2435] border border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-4 bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                {isLoading ? <LoadingSpinner /> : "Register"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-center space-y-4">
            <p className="text-sm text-gray-400 text-center">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-purple-400 font-medium hover:text-purple-300 transition-colors"
              >
                Login here
              </Link>
            </p>

            {/* OR Separator */}
            <div className="relative w-full max-w-sm flex items-center">
              <div className="flex-grow border-t border-gray-600"></div>
              <span className="px-2 text-gray-500 text-sm">OR</span>
              <div className="flex-grow border-t border-gray-600"></div>
            </div>

            <GoogleLogin
              clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
              onSuccess={handleGoogleLoginSuccess}
              onError={handleGoogleLoginError}
              theme="filled_black"
              size="large"
              className="w-full max-w-sm"
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default RegisterPage;
