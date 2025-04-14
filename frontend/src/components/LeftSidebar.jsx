import React, { forwardRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import {
  LayoutGrid,
  Globe,
  User,
  LogOut,
  Search,
  Home,
  MessageSquare,
  MessageCircle,
} from "lucide-react";
import FeedbackModal from "./FeedbackModal";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const LeftSidebar = forwardRef(
  ({ isSidebarOpen, closeSidebar, openSearchDrawer }, ref) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

    const handleLogout = () => {
      localStorage.removeItem("token");
      navigate("/login");
    };

    const handleProfileNavigation = () => {
      const username = localStorage.getItem("username");
      navigate(`/profile/${username}`);
    };

    const handleNavigation = (path) => {
      navigate(path);
      closeSidebar();
    };

    const openFeedbackModal = () => setIsFeedbackModalOpen(true);
    const closeFeedbackModal = () => setIsFeedbackModalOpen(false);

    const navItems = [
      { icon: Home, title: "Home", path: "/welcome" },
      { icon: LayoutGrid, title: "Forums", path: "/forum" },
      { icon: MessageSquare, title: "Messages", path: "/chat-list" },
      { icon: Search, title: "Search", onClick: openSearchDrawer },
    ];

    const isActive = (path) => {
      if (path === "#") return false;
      return (
        location.pathname === path || location.pathname.startsWith(path + "/")
      );
    };

    return (
      <TooltipProvider>
        <div
          ref={ref}
          className={`sidebar fixed left-0 top-0 h-full bg-[#1a1425] flex flex-col items-center py-4 transition-all duration-300 ease-in-out z-50 ${
            isSidebarOpen
              ? "w-64 translate-x-0 opacity-100"
              : "w-16 -translate-x-full opacity-0 md:opacity-100 md:translate-x-0"
          } md:w-16`}
        >
          {/* Lyceum Branding */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                onClick={() => handleNavigation("/welcome")}
                className="w-14 h-14 rounded-full cursor-pointer flex items-center justify-center group transition-all duration-300 border-2 border-purple-600 hover:border-purple-500"
              >
                <img src="/favicon.ico" alt="Lyceum" className="w-10 h-10" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="hidden md:block">
              <p>Go to Welcome Page</p>
            </TooltipContent>
          </Tooltip>

          {/* Main Navigation */}
          <nav className="flex flex-col space-y-6 flex-1 mt-8 w-full px-3">
            {navItems.map((item) => (
              <Tooltip key={item.title}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      item.onClick
                        ? item.onClick()
                        : handleNavigation(item.path)
                    }
                    className={`w-full justify-start md:justify-center transition-colors duration-200 ${
                      isActive(item.path)
                        ? "text-purple-500 bg-purple-500/10 hover:bg-purple-500/20"
                        : "text-gray-400 hover:text-black hover:bg-gray-200"
                    }`}
                  >
                    <item.icon size={20} className="mr-2 md:mr-0" />
                    <span className="md:hidden">{item.title}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="hidden md:block">
                  <p>{item.title}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </nav>

          {/* Lower Section */}
          <div className="mt-auto space-y-4 mb-4 w-full px-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleProfileNavigation()}
                  className={`w-full justify-start md:justify-center transition-colors duration-200 ${
                    location.pathname.startsWith("/profile")
                      ? "text-purple-500 bg-purple-500/10 hover:bg-purple-500/20"
                      : "text-gray-400 hover:text-black hover:bg-gray-200"
                  }`}
                >
                  <User size={20} className="mr-2 md:mr-0" />
                  <span className="md:hidden">Profile</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="hidden md:block">
                <p>Profile</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full text-gray-400 hover:text-black hover:bg-gray-200 justify-start md:justify-center"
                >
                  <LogOut size={20} className="mr-2 md:mr-0" />
                  <span className="md:hidden">Logout</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="hidden md:block">
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openFeedbackModal}
                  className="w-full text-gray-400 hover:text-black hover:bg-gray-200 justify-start md:justify-center"
                >
                  <MessageCircle size={20} className="mr-2 md:mr-0" />
                  <span className="md:hidden">Feedback</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="hidden md:block">
                <p>Feedback</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <FeedbackModal
            isOpen={isFeedbackModalOpen}
            onClose={closeFeedbackModal}
          />
        </div>
      </TooltipProvider>
    );
  }
);

LeftSidebar.displayName = "LeftSidebar";

export default LeftSidebar;
