import React, { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { LayoutGrid, MessageSquare, Globe, BarChart, BookOpen, User, LogOut, Search, Home } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const LeftSidebar = forwardRef(({ isSidebarOpen, closeSidebar, openSearchDrawer }, ref) => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  const handleProfileNavigation = () => {
    const username = sessionStorage.getItem('username');
    navigate(`/profile/${username}`);
  }

  const handleNavigation = (path) => {
    navigate(path);
    closeSidebar();
  };

  const navItems = [
    { icon: Home, title: 'Home', path: '/welcome' },
    { icon: LayoutGrid, title: 'Forums', path: '/forum' },
    { icon: Globe, title: 'Global', path: '#' },
    // { icon: MessageSquare, title: 'Messages', path: '/chat-list' },
    { icon: Search, title: 'Search', onClick: openSearchDrawer },
  ];

  return (
    <TooltipProvider>
      <div 
        ref={ref}
        className={`sidebar fixed left-0 top-0 h-full bg-[#1a1425] flex flex-col items-center py-4 transition-all duration-300 ease-in-out z-50 ${
          isSidebarOpen ? 'w-64 translate-x-0 opacity-100' : 'w-16 -translate-x-full opacity-0 md:opacity-100 md:translate-x-0'
        } md:w-16`}
      >
        {/* Lyceum Branding */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              onClick={() => handleNavigation('/welcome')} 
              className="w-14 h-14 bg-purple-600 rounded-lg cursor-pointer flex flex-col items-center justify-center group transition-all duration-300 hover:bg-purple-500"
            >
              <BookOpen size={24} className="text-black mb-1" />
              <span className="text-xs font-bold text-white opacity-90 group-hover:opacity-100 transition-opacity duration-300">Lyceum</span>
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
                  onClick={() => item.onClick ? item.onClick() : handleNavigation(item.path)} 
                  className="w-full text-gray-400 hover:text-black justify-start md:justify-center"
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

        {/* Profile and Logout Section */}
        <div className="mt-auto space-y-4 mb-4 w-full px-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleProfileNavigation()}
                className="w-full text-gray-400 hover:text-black justify-start md:justify-center"
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
                className="w-full text-gray-400 hover:text-black justify-start md:justify-center"
              >
                <LogOut size={20} className="mr-2 md:mr-0" />
                <span className="md:hidden">Logout</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="hidden md:block">
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
});

LeftSidebar.displayName = 'LeftSidebar';

export default LeftSidebar;

