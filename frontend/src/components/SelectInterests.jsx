import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import {
  FaGraduationCap,
  FaLaptopCode,
  FaPalette,
  FaGuitar,
  FaVolleyballBall,
  FaChalkboardTeacher,
  FaTheaterMasks,
  FaGlobeAmericas,
  FaChartLine,
  FaBookReader,
} from "react-icons/fa";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Card, CardContent } from "./ui/card";
import { toast } from "react-hot-toast";
import { cn } from "../lib/utils";

const API_URL = process.env.REACT_APP_API_URL;

const interests = [
  {
    name: "Academic Excellence",
    icon: <FaGraduationCap />,
    description: "Study tips, research opportunities",
  },
  {
    name: "Computer Science",
    icon: <FaLaptopCode />,
    description: "Programming, AI, cybersecurity",
  },
  {
    name: "Arts & Design",
    icon: <FaPalette />,
    description: "Visual arts, graphic design, photography",
  },
  {
    name: "Music & Performance",
    icon: <FaGuitar />,
    description: "Bands, choirs, theater groups",
  },
  {
    name: "Sports & Fitness",
    icon: <FaVolleyballBall />,
    description: "Intramural sports, fitness classes",
  },
  {
    name: "Teaching & Tutoring",
    icon: <FaChalkboardTeacher />,
    description: "Peer tutoring, teaching assistantships",
  },
  {
    name: "Campus Events",
    icon: <FaTheaterMasks />,
    description: "Festivals, guest lectures, workshops",
  },
  {
    name: "Global Studies",
    icon: <FaGlobeAmericas />,
    description: "Study abroad, language exchange",
  },
  {
    name: "Entrepreneurship",
    icon: <FaChartLine />,
    description: "Startups, business competitions",
  },
  {
    name: "Book Club",
    icon: <FaBookReader />,
    description: "Literature discussions, author meetups",
  },
];

const yearLevels = [
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "Graduate",
  "PhD",
];

function SelectInterests() {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo =
    typeof location.state?.returnTo === "string"
      ? location.state.returnTo
      : "/dashboard";
  const { user } = useAuth();

  useEffect(() => {
    const totalSelections =
      selectedInterests.length + selectedCategories.length;
    const totalOptions = interests.length + yearLevels.length;
    setProgress((totalSelections / totalOptions) * 100);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error("Please sign in first");
      return;
    }

    if (selectedInterests.length === 0 && selectedCategories.length === 0) {
      toast.error("Select at least one interest or year level");
      return;
    }

    try {
      await axios.patch(`${API_URL}/user/preferences`, {
        interests: selectedInterests,
        categories: selectedCategories,
      });
      toast.success("Preferences saved!");
      navigate(returnTo);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences. Please try again.");
    }
  };

  const selectionCount =
    selectedInterests.length + selectedCategories.length;

  return (
    <div className="min-h-screen bg-[#0f0a1f] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 text-gray-300 hover:text-white hover:bg-white/10"
          onClick={() => navigate(returnTo)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-900/50 ring-2 ring-purple-400/30 mb-4">
            <Sparkles className="h-6 w-6 text-purple-200" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 bg-clip-text text-transparent">
            Discover your campus interests
          </h1>
          <p className="mt-3 text-gray-300 max-w-xl mx-auto text-sm sm:text-base">
            Pick topics you care about and your year level. This helps Lyceum
            personalize your profile and recommendations.
          </p>
        </div>

        <div className="mb-8 rounded-xl border border-purple-500/25 bg-[#1a1425] p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-300">Profile setup</span>
            <span className="text-purple-200 font-medium tabular-nums">
              {selectionCount} selected
            </span>
          </div>
          <Progress
            value={progress}
            className="h-2 bg-[#2a2038] [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-violet-400"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-white mb-1">
              Your interests
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Choose as many as you like
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {interests.map((interest) => {
                const isSelected = selectedInterests.includes(interest.name);
                return (
                  <motion.div
                    key={interest.name}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Card
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "cursor-pointer border text-white transition-all shadow-none",
                        isSelected
                          ? "border-purple-400/60 bg-gradient-to-br from-purple-900/80 to-violet-900/50 ring-1 ring-purple-400/40"
                          : "border-purple-500/25 bg-[#1a1425] hover:border-purple-400/40 hover:bg-[#241b33]"
                      )}
                      onClick={() => handleInterestChange(interest.name)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleInterestChange(interest.name);
                        }
                      }}
                    >
                      <CardContent className="flex items-start gap-3 p-4">
                        <div
                          className={cn(
                            "text-2xl shrink-0 mt-0.5",
                            isSelected ? "text-purple-200" : "text-purple-400"
                          )}
                        >
                          {interest.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-white leading-snug">
                              {interest.name}
                            </h3>
                            {isSelected && (
                              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white">
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                            {interest.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-1">
              Your year
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Select your current academic standing
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {yearLevels.map((category) => {
                const isSelected = selectedCategories.includes(category);
                return (
                  <motion.div
                    key={category}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "cursor-pointer border text-white transition-all shadow-none",
                        isSelected
                          ? "border-purple-400/60 bg-gradient-to-br from-purple-800/70 to-violet-800/50 ring-1 ring-purple-400/40"
                          : "border-purple-500/25 bg-[#1a1425] hover:border-purple-400/40 hover:bg-[#241b33]"
                      )}
                      onClick={() => handleCategoryChange(category)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleCategoryChange(category);
                        }
                      }}
                    >
                      <CardContent className="flex items-center justify-center gap-2 p-4">
                        <h3 className="font-semibold text-white">{category}</h3>
                        {isSelected && (
                          <Check className="h-4 w-4 text-purple-200" />
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <Button
            type="submit"
            className="w-full border-0 bg-gradient-to-r from-purple-600 to-violet-500 py-5 text-base text-white shadow-lg shadow-purple-600/30 hover:from-purple-500 hover:to-violet-400 hover:text-white"
          >
            Save & continue
          </Button>
        </form>
      </div>
    </div>
  );
}

export default SelectInterests;
