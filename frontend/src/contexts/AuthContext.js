import { createContext, useContext } from "react";

export const AuthContext = createContext({
  user: null,
  socketToken: null,
  isAuthenticated: false,
  isLoading: true,
  refreshAuth: async () => {},
  establishSessionFromToken: () => null,
  logout: async () => {},
  refreshSocketToken: async () => null,
});

export const useAuth = () => useContext(AuthContext);
