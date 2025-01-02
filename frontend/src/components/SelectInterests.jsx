import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaLaptopCode, FaPalette, FaGuitar, FaVolleyballBall, FaChalkboardTeacher, FaTheaterMasks, FaGlobeAmericas, FaChartLine, FaBookReader } from 'react-icons/fa';
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Card, CardContent } from "./ui/card";
import { useToast, ToastProvider } from "./ui/use-toast";

const API_URL = process.env.REACT_APP_API_URL + '/users/preferences';

const interests = [
  { name: 'Academic Excellence', icon: <FaGraduationCap />, description: 'Study tips, research opportunities' },
  { name: 'Computer Science', icon: <FaLaptopCode />, description: 'Programming, AI, cybersecurity' },
  { name: 'Arts & Design', icon: <FaPalette />, description: 'Visual arts, graphic design, photography' },
  { name: 'Music & Performance', icon: <FaGuitar />, description: 'Bands, choirs, theater groups' },
  { name: 'Sports & Fitness', icon: <FaVolleyballBall />, description: 'Intramural sports, fitness classes' },
  { name: 'Teaching & Tutoring', icon: <FaChalkboardTeacher />, description: 'Peer tutoring, teaching assistantships' },
  { name: 'Campus Events', icon: <FaTheaterMasks />, description: 'Festivals, guest lectures, workshops' },
  { name: 'Global Studies', icon: <FaGlobeAmericas />, description: 'Study abroad, language exchange' },
  { name: 'Entrepreneurship', icon: <FaChartLine />, description: 'Startups, business competitions' },
  { name: 'Book Club', icon: <FaBookReader />, description: 'Literature discussions, author meetups' },
];

const categories = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'PhD'];

function SelectInterests() {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    updateProgress();
  }, [selectedInterests, selectedCategories]);

  const handleInterestChange = (interest) => {
    setSelectedInterests((prevState) =>
      prevState.includes(interest)
        ? prevState.filter((item) => item !== interest)
        : [...prevState, interest]
    );
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories((prevState) =>
      prevState.includes(category)
        ? prevState.filter((item) => item !== category)
        : [...prevState, category]
    );
  };

  const updateProgress = () => {
    const totalSelections = selectedInterests.length + selectedCategories.length;
    const totalOptions = interests.length + categories.length;
    const progressPercentage = (totalSelections / totalOptions) * 100;
    setProgress(progressPercentage);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');

    try {
      await axios.patch(`${API_URL}/${userId}`, {
        interests: selectedInterests,
        categories: selectedCategories,
      });
      toast({
        title: "Preferences saved!",
        description: "Your interests have been updated successfully.",
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#0f0a1f] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-purple-400 mb-8">Discover Your Campus Interests!</h1>
          
          <Progress value={progress} className="mb-8" />
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-purple-300">Your Interests</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {interests.map((interest) => (
                    <motion.div
                      key={interest.name}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all ${
                          selectedInterests.includes(interest.name)
                            ? 'bg-purple-700 border-purple-500'
                            : 'bg-[#1a1425] border-purple-600/20 hover:bg-[#2a2435]'
                        }`}
                        onClick={() => handleInterestChange(interest.name)}
                      >
                        <CardContent className="flex items-center p-4">
                          <div className="text-3xl mr-4 text-purple-400">{interest.icon}</div>
                          <div>
                            <h3 className="font-semibold">{interest.name}</h3>
                            <p className="text-sm text-gray-400">{interest.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-purple-300">Your Year</h2>
                <div className="grid grid-cols-2 gap-4">
                  {categories.map((category) => (
                    <motion.div
                      key={category}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all ${
                          selectedCategories.includes(category)
                            ? 'bg-purple-700 border-purple-500'
                            : 'bg-[#1a1425] border-purple-600/20 hover:bg-[#2a2435]'
                        }`}
                        onClick={() => handleCategoryChange(category)}
                      >
                        <CardContent className="flex items-center justify-center p-4">
                          <h3 className="font-semibold">{category}</h3>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors"
            >
              Start Your Campus Journey!
            </Button>
          </form>
        </div>
      </div>
    </ToastProvider>
  );
}

export default SelectInterests;

