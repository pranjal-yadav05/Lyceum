import express from 'express';
import multer from 'multer';
import { put, del } from '@vercel/blob';
import User from '../models/User.js';
import { config } from 'dotenv';
import authenticateToken from '../middleware/authenticateToken.js';

config();

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to extract blob path from URL
const getBlobPathFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // Remove leading slash
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
};

// Update profile image
router.post('/profile-image', authenticateToken, upload.single('profile-image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user.id;
    
    // Get the user's current profile image URL
    const user = await User.findById(userId);
    if (user.profileImage) {
      // Delete old profile image from Blob storage
      const oldBlobPath = getBlobPathFromUrl(user.profileImage);
      if (oldBlobPath) {
        try {
          await del(oldBlobPath, {
            token: process.env.BLOB_READ_WRITE_TOKEN
          });
        } catch (deleteError) {
          console.error('Error deleting old profile image:', deleteError);
          // Continue with upload even if delete fails
        }
      }
    }

    const buffer = req.file.buffer;
    const filename = `profile-${Date.now()}-${userId}`;

    // Upload new image to Vercel Blob Storage
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

    // Get the user's current cover image URL
    const user = await User.findById(userId);
    if (user.coverImage) {
      // Delete old cover image from Blob storage
      const oldBlobPath = getBlobPathFromUrl(user.coverImage);
      if (oldBlobPath) {
        try {
          await del(oldBlobPath, {
            token: process.env.BLOB_READ_WRITE_TOKEN
          });
        } catch (deleteError) {
          console.error('Error deleting old cover image:', deleteError);
          // Continue with upload even if delete fails
        }
      }
    }

    const buffer = req.file.buffer;
    const filename = `cover-${Date.now()}-${userId}`;

    // Upload new image to Vercel Blob Storage
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