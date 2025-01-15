import express from 'express';
import multer from 'multer';
import path from 'path';
import User from '../models/User.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Update profile image
router.post('/profile-image', authenticateToken, upload.single('profile-image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('updating profile image')
    const userId = req.user.id;
    const imagePath = `/uploads/${req.file.filename}`;

    await User.findByIdAndUpdate(userId, { profileImage: imagePath });
    console.log('profile image updated')
    res.json({ message: 'Profile image updated successfully', imagePath });
  } catch (error) {
    console.error('Error updating profile image:', error);
    res.status(500).json({ message: 'Error updating profile image' });
  }
});

// Update cover image
router.post('/cover-image', authenticateToken, upload.single('cover-image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user.id;
    const imagePath = `/uploads/${req.file.filename}`;

    await User.findByIdAndUpdate(userId, { coverImage: imagePath });

    res.json({ message: 'Cover image updated successfully', imagePath });
  } catch (error) {
    console.error('Error updating cover image:', error);
    res.status(500).json({ message: 'Error updating cover image' });
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
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

router.get('/', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const users = await User.find({ username: { $regex: query, $options: 'i' } });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;