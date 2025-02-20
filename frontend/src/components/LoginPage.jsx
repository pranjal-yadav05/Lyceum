import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

import { useToast } from './ui/use-toast';

import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"

import LoadingSpinner from './LoadingSpinner';

// Assuming logo is placed in public/images folder
const logoPath = "/images/lyceum-logo.png";


const API_URL = process.env.REACT_APP_API_URL;

function LoginPage({ setAuth, onLoginSuccess }) {

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLinkAccount, setShowLinkAccount] = useState(false);
  const [googleResponse, setGoogleResponse] = useState(null);
  const { toast } = useToast();


  const navigate = useNavigate();

  const handleGoogleLoginSuccess = async (response) => {
    setIsLoading(true);
    try {
      const token = response.credential;
      const res = await axios.post(`${API_URL}/auth/google`, { token });
      
      if (res.data.suggestLinking) {
        setGoogleResponse(response);
        setShowLinkAccount(true);
        return;
      }


      onLoginSuccess(res.data.token);
      setAuth(true);
      navigate('/welcome');
      toast({
        title: 'Login successful',
        description: 'You have been logged in with Google',
      });
    } catch (err) {
      setError('Google login failed');
      toast({
        title: 'Login failed',
        description: 'There was an error logging in with Google',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkAccount = async (e, googleResponse) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = googleResponse.credential;

      const res = await axios.post(`${API_URL}/auth/link-account`, {
        googleToken: token
      });

      
      onLoginSuccess(res.data.token);
      setAuth(true);
      navigate('/welcome');
      toast({
        title: 'Account linked',
        description: 'Your account has been successfully linked with Google',
      });
    } catch (err) {
      setError('Failed to link account');
      toast({
        title: 'Linking failed',
        description: 'There was an error linking your account',
        variant: 'destructive',
      });
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
  }, [setAuth, navigate, onLoginSuccess]);




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
          <CardTitle className="text-xl font-bold text-center text-white mb-2">Welcome Back</CardTitle>
          <CardDescription className="text-center text-gray-200 text-sm">Sign in to continue to Lyceum</CardDescription>




        </CardHeader>

        <CardContent>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {showLinkAccount ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 text-center">
                We found an existing account. Would you like to link it with Google?
              </p>
              <Button 
                onClick={(e) => handleLinkAccount(e, googleResponse)}


                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? <LoadingSpinner /> : 'Link Account'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowLinkAccount(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400 text-center">
                Don't have an account?{' '}
                <Link to="/register" className="text-purple-300 font-medium hover:text-purple-200 transition-colors text-sm">



                  Register here
                </Link>
              </p>
              <div className="w-full">
                <GoogleLogin 
                  clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
                  onSuccess={handleGoogleLoginSuccess}
                  onError={handleGoogleLoginError}
                  theme="filled_black"
                  size="large"
                />


              </div>
            </>
          )}
        </CardFooter>

      </Card>
      </div>
    </div>
  );
}


export default LoginPage;
