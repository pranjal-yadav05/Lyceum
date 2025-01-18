import express from 'express';
import Post from '../models/Post.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get one post
router.get('/:postId', getPost, (req, res) => {
  res.json(res.post);
});

// Create a new post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const post = new Post({
      content: req.body.content,
      author: req.user.username,
      topicId: req.body.topicId,
      replyTo: req.body.replyTo || null
    });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a post
router.patch('/:postId', getPost, authenticateToken, async (req, res) => {
  if (req.body.content != null) {
    res.post.content = req.body.content;
  }
  try {
    const updatedPost = await res.post.save();
    res.json(updatedPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a post
router.delete('/:postId', getPost, authenticateToken, async (req, res) => {
  try {
    await res.post.remove();
    res.json({ message: 'Deleted Post' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

async function getPost(req, res, next) {
  let post;
  try {
    post = await Post.findById(req.params.postId);
    if (post == null) {
      return res.status(404).json({ message: 'Cannot find post' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
  res.post = post;
  next();
}

export default router;

