import express from 'express';
import Topic from '../models/Topic.js';
import Post from '../models/Post.js';
import StudySession from '../models/StudySession.js';
import axios from 'axios';

const router = express.Router();

router.get('/', async (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://lyceum-one.vercel.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  try {
    const activeTopics = await Topic.countDocuments();
    const totalPosts = await Post.countDocuments();

    // Calculate total study hours
    const studySessions = await StudySession.find();
    const totalStudyHours = studySessions.reduce((total, session) => {
      return total + (session.duration / 60); // Convert minutes to hours
    }, 0);
    

    // Fetch active rooms count from socket server
    const socketServerUrl = process.env.SOCKET_SERVER_URL;
    const activeRoomsResponse = await axios.get(`${socketServerUrl}/active-rooms`);
    const activeRooms = activeRoomsResponse.data.activeRooms;
    
    res.json({
      activeTopics,
      totalPosts,
      totalStudyHours: Math.round(totalStudyHours),
      activeRooms
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: "Error fetching stats", error: error.message });
  }
});

export default router;

