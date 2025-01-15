import express from 'express';
import multer from 'multer';
import { put } from '@vercel/blob';
import User from '../models/User.js';
import { config } from 'dotenv';
import authenticateToken from '../middleware/authenticateToken.js';

config();

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Update profile image
router.post('/profile-image', authenticateToken, upload.single('profile-image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user.id;
    const buffer = req.file.buffer;
    const filename = `profile-${Date.now()}-${userId}`;

    // Upload to Vercel Blob Storage
    const blob = await put(filename, buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: req.file.mimetype
    });

    // Update user's profile image URL in the database
    await User.findByIdAndUpdate(userId, { profileImage: blob.url });

    res.json({ 
      message: 'Profile image updated successfully',
      url: blob.url 
    });
  } catch (error) {
    console.error('Error updating profile image:', error);
    res.status(500).json({ message: 'Error updating profile image', error: error.message });
  }
});

// Update cover image
router.post('/cover-image', authenticateToken, upload.single('cover-image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user.id;
    const buffer = req.file.buffer;
    const filename = `cover-${Date.now()}-${userId}`;

    // Upload to Vercel Blob Storage
    const blob = await put(filename, buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: req.file.mimetype
    });

    // Update user's cover image URL in the database
    await User.findByIdAndUpdate(userId, { coverImage: blob.url });

    res.json({ 
      message: 'Cover image updated successfully',
      url: blob.url 
    });
  } catch (error) {
    console.error('Error updating cover image:', error);
    res.status(500).json({ message: 'Error updating cover image', error: error.message });
  }
});

router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
});

router.get('/', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const users = await User.find({ username: { $regex: query, $options: 'i' } }).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

export default router;

