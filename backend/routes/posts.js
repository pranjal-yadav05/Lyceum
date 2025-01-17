import express from 'express';
import Post from '../models/Post.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

// Create a new post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const post = new Post({
      content: req.body.content,
      author: req.user.username,
      topicId: req.body.topicId
    });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all posts for a specific topic
router.get('/topic/:topicId', async (req, res) => {
  try {
    const posts = await Post.find({ topicId: req.params.topicId }).sort({ createdAt: 1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a post
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    if (post.author !== req.user.username) {
      return res.status(403).json({ message: 'You can only update your own posts' });
    }

    post.content = req.body.content;
    post.updatedAt = Date.now();
    
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author !== req.user.username) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

