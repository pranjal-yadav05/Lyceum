import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { API_URL } from "../config/env";

const AdminShortcut = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkAdminStatus = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/admin/check-access`
        );
        setIsAdmin(response.data.isAdmin);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAdmin) return;

    const handleKeyPress = async (event) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "l") {
        try {
          const response = await axios.get(
            `${API_URL}/admin/check-access`
          );
          if (response.data.isAdmin) {
            navigate("/admin/dashboard");
          }
        } catch (error) {
          console.error("Error checking admin access:", error);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [navigate, isAdmin]);

  return null;
};

export default AdminShortcut;
