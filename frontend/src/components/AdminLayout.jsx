import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ErrorAlert from "./ErrorAlert";
import LeftSidebar from "./LeftSidebar";
import { Menu } from "lucide-react";
import { Card, CardContent } from "./ui/card";

const AdminLayout = ({ children }) => {
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Session expired");
        }

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/admin/check-access`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.data.isAdmin) {
          throw new Error("Access denied. Admin privileges required.");
        }
      } catch (err) {
        console.error("Admin access check failed:", err);
        if (err.message === "Session expired") {
          setError("Session expired. Please login again.");
          navigate("/login");
        } else {
          setError(err.message);
        }
      }
    };

    checkAdminAccess();
  }, [navigate]);

  const openSearchDrawer = () => {
    // Implement search drawer functionality if needed
    // console.log("Search drawer opened");
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1339] via-[#2a1f5a] to-[#3a2b7a] p-4">
        <ErrorAlert message={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1339] via-[#2a1f5a] to-[#3a2b7a]">
      <LeftSidebar
        ref={sidebarRef}
        isSidebarOpen={isSidebarOpen}
        closeSidebar={() => setIsSidebarOpen(false)}
        openSearchDrawer={openSearchDrawer}
      />

      {/* Hamburger Menu Button - Only visible on mobile */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-[#1a1425] text-white md:hidden hover:bg-[#2a1f5a] transition-colors duration-200"
      >
        <Menu size={24} />
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-64" : "ml-0"
        } md:ml-16`}
      >
        <main className="p-4 md:p-6">
          <Card className="bg-[#1a1425]/80 backdrop-blur-md border border-purple-600/20">
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4">{children}</div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
