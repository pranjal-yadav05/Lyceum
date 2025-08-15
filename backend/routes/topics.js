import express from "express";
import Topic from "../models/Topic.js";
import Post from "../models/Post.js";
import User from "../models/User.js"; // Import User model
import authenticateToken from "../middleware/authenticateToken.js";

const router = express.Router();

// Topic Routes

// Create a new topic
router.post("/topics", async (req, res) => {
  try {
    const topic = new Topic({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await topic.save();
    res.status(201).json(topic);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all topics
router.get("/topics", async (req, res) => {
  try {
    const topics = await Topic.find().sort({ createdAt: -1 }).lean();

    // Get post counts for each topic
    const topicsWithCounts = await Promise.all(
      topics.map(async (topic) => {
        const postsCount = await Post.countDocuments({ topicId: topic._id });
        return { ...topic, postsCount };
      })
    );
    res.json(topicsWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific topic by ID
router.get("/topics/:id", async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id).lean();

    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    // Get post count for the topic
    const postsCount = await Post.countDocuments({ topicId: topic._id });

    // Get the latest post in the topic
    const latestPost = await Post.findOne({ topicId: topic._id })
      .sort({ createdAt: -1 })
      .lean();

    // Combine topic data with additional information
    const topicWithDetails = {
      ...topic,
      postsCount,
      latestPost: latestPost || null,
    };

    res.json(topicWithDetails);
  } catch (error) {
    // Handle invalid ID format
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid topic ID format" });
    }
    res.status(500).json({ message: error.message });
  }
});

// Get topics by category
router.get("/topics/category/:category", async (req, res) => {
  try {
    const topics = await Topic.find({ category: req.params.category }).sort({
      createdAt: -1,
    });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a topic
router.patch("/topics/:id", async (req, res) => {
  try {
    const topic = await Topic.findOne({ _id: req.params.id });
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    // Check if user is the author
    if (topic.author !== req.body.username) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this topic" });
    }

    const updatedTopic = await Topic.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.json(updatedTopic);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a topic
router.delete("/topics/:id", authenticateToken, async (req, res) => {
  try {
    const topic = await Topic.findOne({ _id: req.params.id });
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    // Check if user is the author
    if (topic.author !== req.user.username) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this topic" });
    }

    await Topic.findByIdAndDelete(req.params.id);
    // Delete all posts in the topic
    await Post.deleteMany({ topicId: req.params.id });
    res.json({ message: "Topic and associated posts deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Post Routes within Topics

// Create a new post in a topic
router.post("/topics/:topicId/posts", async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.topicId);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const post = new Post({
      ...req.body,
      topicId: req.params.topicId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all posts in a topic
router.get("/topics/:topicId/posts", async (req, res) => {
  try {
    const posts = await Post.find({ topicId: req.params.topicId }).sort({
      createdAt: 1,
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a post
router.patch("/topics/:topicId/posts/:postId", async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.postId,
      topicId: req.params.topicId,
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is the author
    if (post.author !== req.user.username) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this post" });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.postId,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.json(updatedPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a post
router.delete("/topics/:topicId/posts/:postId", async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.postId,
      topicId: req.params.topicId,
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is the author
    if (post.author !== req.user.username) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(req.params.postId);
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch all users and display their information
router.get("/users", async (req, res) => {
  try {
    const { sortBy = "createdAt", order = "desc" } = req.query; // Default sorting by createdAt in descending order

    // Validate sortBy and order values
    const validSortFields = ["createdAt", "updatedAt", "lastSeen"];
    const validOrderValues = ["asc", "desc"];

    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({ message: "Invalid sortBy field" });
    }

    if (!validOrderValues.includes(order)) {
      return res.status(400).json({ message: "Invalid order value" });
    }

    const users = await User.find()
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .lean();

    const formattedUsers = users.map((user) => ({
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      accountType: user.googleId ? "Google Account" : "Email Only Account",
      coverImage: user.coverImage || null,
      profileImage: user.profileImage || null,
      lastSeen: user.lastSeen || "A long time ago",
    }));

    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
