import express from 'express';
import authenticateToken from '../middleware/authenticateToken.js';
import Message from '../models/Message.js';
import mongoose from 'mongoose';

const router = express.Router();

// Send a new message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const message = new Message({
      sender: req.user.id,
      recipient: recipientId,
      content
    });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get conversation between two users
router.get('/conversation/:userId', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user.id }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username')
    .populate('recipient', 'username');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get list of conversations for current user
// Get list of conversations for current user
router.get('/conversations', authenticateToken, async (req, res) => {
    try {
      // Add console.log to debug
      console.log('User ID from token:', req.user.id);
  
      const messages = await Message.aggregate([
        {
          $match: {
            $or: [
              { sender: new mongoose.Types.ObjectId(req.user.id) },    // Convert to ObjectId
              { recipient: new mongoose.Types.ObjectId(req.user.id) }  // Convert to ObjectId
            ]
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$sender', new mongoose.Types.ObjectId(req.user.id)] },
                '$recipient',
                '$sender'
              ]
            },
            lastMessage: { $first: '$$ROOT' }
          }
        }
      ]);
  
      // Populate user details after aggregation
      const populatedMessages = await Message.populate(messages, {
        path: 'lastMessage.sender lastMessage.recipient',
        select: 'username'
      });
  
      res.json(populatedMessages);
    } catch (error) {
      console.error('Error in conversations route:', error); // Add error logging
      res.status(500).json({ error: error.message });
    }
  });

export default router;