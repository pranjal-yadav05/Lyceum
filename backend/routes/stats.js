import express from 'express';
import Topic from '../models/Topic.js';
import Post from '../models/Post.js';
import StudySession from '../models/StudySession.js';
import axios from 'axios';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';

dotenv.config()

const router = express.Router();
const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

router.get('/', async (req, res) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let stats = cache.get('stats');
    if (stats) {
      return res.json(stats);
    }

    const [activeTopics, totalPosts, studySessions] = await Promise.all([
      Topic.countDocuments(),
      Post.countDocuments(),
      StudySession.aggregate([
        {
          $group: {
            _id: null,
            totalDuration: { $sum: '$duration' }
          }
        }
      ])
    ]);

    const totalStudyHours = Math.round((studySessions[0]?.totalDuration || 0) / 60);

    stats = {
      activeTopics,
      totalPosts,
      totalStudyHours
    };

    cache.set('stats', stats);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: "Error fetching stats", error: error.message });
  }
});

export default router;

