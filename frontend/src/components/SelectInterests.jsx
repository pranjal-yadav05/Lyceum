import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaUserAstronaut, FaMusic, FaFilm, FaRunning, FaCode, FaHeart } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL + '/users/preferences';

function SelectInterests() {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [progress, setProgress] = useState(0); // Track progress of form completion
  const navigate = useNavigate();

  const interests = [
    { name: 'Technology', icon: <FaCode />, description: 'Programming, AI, and Robotics' },
    { name: 'Sports', icon: <FaRunning />, description: 'Football, Basketball, etc.' },
    { name: 'Movies', icon: <FaFilm />, description: 'Action, Drama, Sci-Fi' },
    { name: 'Music', icon: <FaMusic />, description: 'Rock, Pop, Classical' },
    { name: 'Health & Fitness', icon: <FaUserAstronaut />, description: 'Yoga, Gym, Meditation' },
  ];

  const categories = ['Development', 'Design', 'Marketing', 'Entrepreneurship', 'Art & Culture'];

  const handleInterestChange = (interest) => {
    setSelectedInterests((prevState) =>
      prevState.includes(interest)
        ? prevState.filter((item) => item !== interest)
        : [...prevState, interest]
    );
    updateProgress();
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories((prevState) =>
      prevState.includes(category)
        ? prevState.filter((item) => item !== category)
        : [...prevState, category]
    );
    updateProgress();
  };

  // Update progress bar based on selections
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

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">Let's Personalize Your Experience!</h1>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                {Math.round(progress)}% Completed
              </span>
            </div>
          </div>
          <div className="flex mb-2">
            <div className="w-full bg-gray-300 rounded-full">
              <div
                className="bg-blue-500 text-xs leading-none py-1 text-center text-white font-bold rounded-full"
                style={{ width: `${progress}%` }}
              >
                {progress < 50 ? 'Keep going!' : 'Almost there!'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Interests Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Pick Your Interests</h2>
            {interests.map((interest) => (
              <div
                key={interest.name}
                className={`flex items-center p-4 mb-4 border-2 rounded-lg shadow-sm transition-all ${
                  selectedInterests.includes(interest.name) ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                } hover:shadow-xl cursor-pointer`}
                onClick={() => handleInterestChange(interest.name)}
              >
                <div className="mr-4 text-2xl text-blue-600">{interest.icon}</div>
                <div>
                  <h3 className="font-semibold text-lg">{interest.name}</h3>
                  <p className="text-sm text-gray-600">{interest.description}</p>
                </div>
                {selectedInterests.includes(interest.name) && (
                  <FaCheckCircle className="ml-auto text-green-500 text-xl" />
                )}
              </div>
            ))}
          </div>

          {/* Categories Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Categories</h2>
            {categories.map((category) => (
              <div
                key={category}
                className={`flex items-center p-4 mb-4 border-2 rounded-lg shadow-sm transition-all ${
                  selectedCategories.includes(category) ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                } hover:shadow-xl cursor-pointer`}
                onClick={() => handleCategoryChange(category)}
              >
                <div className="text-lg text-blue-600">{category}</div>
                {selectedCategories.includes(category) && (
                  <FaCheckCircle className="ml-auto text-green-500 text-xl" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
        >
          Save Your Preferences
        </button>
      </form>
    </div>
  );
}

export default SelectInterests;
