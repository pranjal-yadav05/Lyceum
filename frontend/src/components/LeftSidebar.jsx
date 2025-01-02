import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { LayoutGrid, MessageSquare, Globe, BarChart, BookOpen, User, LogOut } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export default function LeftSidebar() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <TooltipProvider>
      <div className="fixed left-0 top-0 h-full w-16 bg-[#1a1425] flex flex-col items-center py-4">
        {/* Lyceum Branding */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              onClick={() => navigate('/welcome')} 
              className="w-14 h-14 bg-purple-600 rounded-lg cursor-pointer flex flex-col items-center justify-center group transition-all duration-300 hover:bg-purple-500"
            >
              <BookOpen size={24} className="text-white mb-1" />
              <span className="text-xs font-bold text-white opacity-90 group-hover:opacity-100 transition-opacity duration-300">Lyceum</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Go to Welcome Page</p>
          </TooltipContent>
        </Tooltip>

        {/* Main Navigation - Using flex-1 to push logout to bottom */}
        <nav className="flex flex-col space-y-6 flex-1 mt-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/forum')} 
                className="text-gray-400 hover:text-white"
              >
                <LayoutGrid size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Forums</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-white"
              >
                <Globe size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Global</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-white"
              >
                <MessageSquare size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Messages</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-white"
              >
                <BarChart size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Analytics</p>
            </TooltipContent>
          </Tooltip>
        </nav>

        {/* Profile and Logout Section */}
        <div className="mt-auto space-y-4 mb-4 flex flex-col items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/profile')}
                className="text-gray-400 hover:text-white"
              >
                <User size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Profile</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="text-gray-400 hover:text-white"
              >
                <LogOut size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
