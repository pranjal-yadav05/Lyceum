import React, { useState, useEffect, useCallback, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthContext } from "./contexts/AuthContext";
import { API_URL as CONFIG_API_URL } from "./config/env";
import {
  clearLegacyToken,
  getLegacyToken,
  persistLegacyToken,
  readLegacySession,
  normalizeAuthUser,
} from "./lib/sessionAuth";

const ForumPosts = lazy(() => import("./components/ForumPosts"));
const SelectInterests = lazy(() => import("./components/SelectInterests"));
const SoloStudyCatalog = lazy(() => import("./components/SoloStudyCatalog"));
const SoloStudyRoom = lazy(() => import("./components/SoloStudyRoom"));
const StudyRoomPage = lazy(() => import("./components/StudyRoomPage"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const ProfilePage = lazy(() => import("./components/ProfilePage"));
const ChatPage = lazy(() => import("./components/ChatPage"));
const BlobManager = lazy(() => import("./components/BlobManager"));
const AdminLayout = lazy(() => import("./components/AdminLayout"));
const AdminDashboard = lazy(() => import("./admin-pages/AdminDashboard.jsx"));
const AdminUsers = lazy(() => import("./admin-pages/AdminUsers"));
const AdminFocusSpaces = lazy(() => import("./admin-pages/AdminFocusSpaces"));
const AdminSearch = lazy(() => import("./admin-pages/AdminSearch"));
const AdminErrors = lazy(() => import("./admin-pages/AdminErrors"));
const AdminSettings = lazy(() => import("./admin-pages/AdminSettings"));
const AdminSecurity = lazy(() => import("./admin-pages/AdminSecurity"));
const AdminFeedback = lazy(() => import("./admin-pages/AdminFeedback"));

const API_URL = CONFIG_API_URL;

const REQUIRED_ENV = [
  "REACT_APP_SOCKET_URL",
  "REACT_APP_GOOGLE_CLIENT_ID",
].concat(process.env.NODE_ENV === "production" ? ["REACT_APP_API_URL"] : []);

function EnvGuard({ children }) {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1339] p-4">
        <div className="text-center text-white max-w-md">
          <h1 className="text-xl font-bold mb-2">Configuration Error</h1>
          <p className="text-white/70 text-sm">
            Missing environment variables: {missing.join(", ")}
          </p>
        </div>
      </div>
    );
  }
  return children;
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1339] via-[#2a1f5a] to-[#3a2b7a]">
      <div className="text-white/70">Loading...</div>
    </div>
  );
}

function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

axios.defaults.withCredentials = true;

axios.interceptors.request.use((config) => {
  const token = getLegacyToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [user, setUser] = useState(null);
  const [socketToken, setSocketToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const establishSessionFromToken = useCallback((token, apiUser) => {
    const user = normalizeAuthUser(apiUser, token);
    if (!user) return null;
    persistLegacyToken(token, user);
    setUser(user);
    setSocketToken(token);
    setAuthError(null);
    return { user, socketToken: token };
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/me`);
      if (data.user) {
        setUser(data.user);
        setSocketToken(data.socketToken ?? getLegacyToken());
        setAuthError(null);
        return data;
      }
      setUser(null);
      setSocketToken(null);
      setAuthError(null);
      return data;
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403 || status === 404) {
        const legacy = readLegacySession();
        if (legacy) {
          setUser(legacy.user);
          setSocketToken(legacy.socketToken);
          setAuthError(null);
          return { user: legacy.user, socketToken: legacy.socketToken };
        }
        setUser(null);
        setSocketToken(null);
        return null;
      }
      setUser(null);
      setSocketToken(null);
      setAuthError("Unable to connect to the server. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSocketToken = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/me`);
      const token = data.socketToken ?? getLegacyToken();
      setSocketToken(token);
      return token;
    } catch {
      const legacy = readLegacySession();
      if (legacy?.socketToken) {
        setSocketToken(legacy.socketToken);
        return legacy.socketToken;
      }
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearLegacyToken();
      setUser(null);
      setSocketToken(null);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const isAuthenticated = !!user;
  const username = user?.username ?? "";

  const authValue = {
    user,
    socketToken,
    isAuthenticated,
    isLoading,
    refreshAuth,
    establishSessionFromToken,
    refreshSocketToken,
    logout,
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (authError && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1339] via-[#2a1f5a] to-[#3a2b7a] p-4">
        <div className="text-center text-white max-w-md">
          <p className="text-white/70 mb-4">{authError}</p>
          <button
            onClick={() => {
              setIsLoading(true);
              setAuthError(null);
              refreshAuth();
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <EnvGuard>
        <AuthContext.Provider value={authValue}>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route
                  path="/login"
                  element={
                    isAuthenticated ? (
                      <Navigate to="/dashboard" replace />
                    ) : (
                      <LoginPage onLoginSuccess={refreshAuth} />
                    )
                  }
                />
                <Route
                  path="/register"
                  element={
                    isAuthenticated ? (
                      <Navigate to="/dashboard" replace />
                    ) : (
                      <RegisterPage onLoginSuccess={refreshAuth} />
                    )
                  }
                />

                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/select-interests"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                      <SelectInterests />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/solo-study"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                      <SoloStudyCatalog />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/solo-study/:envId"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                      <SoloStudyRoom />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/studyroom/:roomId"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                      <StudyRoomPage username={username} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/forum"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                      <ForumPosts username={username} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/:username"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                      <ProfilePage username={username} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/blob"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                      <BlobManager />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                      <Dashboard username={username} />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                      <AdminLayout>
                        <Routes>
                          <Route path="dashboard" element={<AdminDashboard />} />
                          <Route path="users" element={<AdminUsers />} />
                          <Route path="focus-spaces" element={<AdminFocusSpaces />} />
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
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="*"
                  element={
                    <Navigate
                      to={isAuthenticated ? "/dashboard" : "/login"}
                      replace
                    />
                  }
                />
              </Routes>
            </Suspense>
            <Toaster position="top-right" />
          </Router>
        </AuthContext.Provider>
      </EnvGuard>
    </ErrorBoundary>
  );
}

export default App;
