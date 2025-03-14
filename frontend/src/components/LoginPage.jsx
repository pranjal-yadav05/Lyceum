import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
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

function LoginPage({ setAuth, onLoginSuccess }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLoginSuccess = async (response) => {
    setIsLoading(true);
    try {
      const token = response.credential;
      const res = await axios.post(`${API_URL}/auth/google`, { token });
      localStorage.setItem("token", res.data.token);
      onLoginSuccess(res.data.token);
      setAuth(true);
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

  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        if (isPasswordRequired) {
          const response = await axios.post(`${API_URL}/auth/login`, {
            identifier,
            password,
          });
          onLoginSuccess(response.data.token);
          setAuth(true);
          navigate("/welcome");
        } else {
          const checkResponse = await axios.post(`${API_URL}/auth/check-user`, {
            identifier,
          });

          if (checkResponse.data.exists) {
            if (checkResponse.data.authMethod === "password") {
              setIsPasswordRequired(true);
            } else if (checkResponse.data.authMethod === "google") {
              setError(
                `Welcome back, ${identifier}! Please sign in using Google to continue.`
              );
              // Show Google Sign-In button
              setIsPasswordRequired(false);
            }
          } else {
            navigate("/register");
          }
        }
      } catch (err) {
        setError(err.response?.data?.error || "Login failed");
      } finally {
        setIsLoading(false);
      }
    },
    [
      identifier,
      password,
      isPasswordRequired,
      onLoginSuccess,
      setAuth,
      navigate,
    ]
  );

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      localStorage.removeItem("token");
      localStorage.setItem("token", token);
      onLoginSuccess(token);
      setAuth(true);
      navigate("/welcome");
    }
  }, [setAuth, navigate, onLoginSuccess]);

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
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-gray-300 text-sm">
              Sign in to continue to Lyceum
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <ErrorAlert message={error} />

              <div className="space-y-4">
                <div>
                  <Label htmlFor="identifier" className="text-gray-200">
                    Email or Username
                  </Label>
                  <Input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your Email or Username"
                    className="bg-[#2a2435] border border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500"
                    autoComplete="username"
                    required
                  />
                </div>

                {isPasswordRequired && (
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
                      autoComplete="current-password"
                      required
                    />
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full mt-4 bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                {isLoading ? <LoadingSpinner /> : "Continue"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-center space-y-4">
            <p className="text-sm text-gray-400 text-center">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-purple-300 font-medium hover:text-purple-200 transition-colors"
              >
                Register here
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

export default LoginPage;
