import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import LoginPage from "./components/LoginPage";
import ForumPosts from "./components/ForumPosts";
import SelectInterests from "./components/SelectInterests";
import RegisterPage from "./components/RegisterPage";
import StudyRoomPage from "./components/StudyRoomPage";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Dashboard from "./components/Dashboard";
import ProfilePage from "./components/ProfilePage";
import { jwtDecode } from "jwt-decode";
import ChatPage from "./components/ChatPage";
import BlobManager from "./components/BlobManager";
import { Toaster } from "react-hot-toast";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./admin-pages/AdminDashboard.jsx";
import AdminUsers from "./admin-pages/AdminUsers";
import AdminStudyRoom from "./admin-pages/AdminStudyRoom";
import AdminSearch from "./admin-pages/AdminSearch";
import AdminErrors from "./admin-pages/AdminErrors";
import AdminSettings from "./admin-pages/AdminSettings";
import AdminSecurity from "./admin-pages/AdminSecurity";
import AdminFeedback from "./admin-pages/AdminFeedback";

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          setUsername(decodedToken.username || "");
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Error decoding token:", error);
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          setUsername("");
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem("token", token);

    try {
      const decodedToken = jwtDecode(token);

      setUsername(decodedToken.username || "");
      setIsAuthenticated(true);
      localStorage.setItem("username", decodedToken.username);
      localStorage.setItem("userId", decodedToken.id); // Use `id` instead of `_id`
      localStorage.setItem("token", token);
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>; // Or replace with a proper loading spinner
  }

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <Router>
        <Routes>
          <Route
            path="*"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={
              <LoginPage
                setAuth={setIsAuthenticated}
                onLoginSuccess={handleLogin}
              />
            }
          />
          <Route
            path="/register"
            element={<RegisterPage onLoginSuccess={handleLogin} />}
          />

          {/* Protected Routes */}
          <Route
            path="/chat"
            element={
              isAuthenticated ? <ChatPage /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/select-interests"
            element={
              isAuthenticated ? (
                <SelectInterests />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/studyroom/:roomId"
            element={
              isAuthenticated ? (
                <StudyRoomPage username={username} setUsername={setUsername} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/forum"
            element={
              isAuthenticated ? (
                <ForumPosts username={username} setUsername={setUsername} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          {/* <Route path="/profile" element={isAuthenticated ? <ProfilePage username={username} setUsername={setUsername}/> : <Navigate to="/login" replace />}/> */}
          <Route
            path="/profile/:username"
            element={
              isAuthenticated ? (
                <ProfilePage username={username} setUsername={setUsername} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/blob" element={<BlobManager />} />

          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Dashboard username={username} setUsername={setUsername} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <AdminLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="studyroom" element={<AdminStudyRoom />} />
                  <Route path="search" element={<AdminSearch />} />
                  <Route path="errors" element={<AdminErrors />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="security" element={<AdminSecurity />} />
                  <Route path="feedback" element={<AdminFeedback />} />
                  <Route
                    path="*"
                    element={<Navigate to="/admin/dashboard" replace />}
                  />
                </Routes>
              </AdminLayout>
            }
          />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </GoogleOAuthProvider>
  );
}

export default App;
