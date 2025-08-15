import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminShortcut = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          // console.log("No token found - not checking admin status");
          return;
        }

        // console.log(
        //   "Checking admin status with token:",
        //   token.substring(0, 10) + "..."
        // );

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/admin/check-access`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // console.log("Admin check response:", response.data);
        setIsAdmin(response.data.isAdmin);
        if (response.data.isAdmin) {
          // console.log("User is admin - adding shortcut listener");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        if (error.response) {
          console.error("Response status:", error.response.status);
          console.error("Response data:", error.response.data);
        }
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const handleKeyPress = async (event) => {
      // Check for Ctrl+Shift+L
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "l") {
        // console.log("Admin shortcut detected");
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            // console.log("No token found - please log in");
            return;
          }

          // console.log(
          //   "Checking admin access with token:",
          //   token.substring(0, 10) + "..."
          // );
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/admin/check-access`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          // console.log("Admin check response:", response.data);
          if (response.data.isAdmin) {
            // console.log("Admin access granted - navigating to dashboard");
            navigate("/admin/dashboard");
          } else {
            // console.log("Admin access denied");
          }
        } catch (error) {
          console.error("Error checking admin access:", error);
          if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
          }
        }
      }
    };

    // console.log("Adding admin shortcut listener");
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      // console.log("Removing admin shortcut listener");
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [navigate, isAdmin]);

  return null; // This component doesn't render anything
};

export default AdminShortcut;
