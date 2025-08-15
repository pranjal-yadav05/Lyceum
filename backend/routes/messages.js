import express from "express";
import authenticateToken from "../middleware/authenticateToken.js";
import Message from "../models/Message.js";
import mongoose from "mongoose";
import User from "../models/User.js";

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({
        error: "Recipient ID and content are required",
      });
    }

    const recipientExists = await User.exists({ _id: recipientId });
    if (!recipientExists) {
      return res.status(404).json({
        error: "Recipient not found",
      });
    }

    const message = new Message({
      sender: req.user.id,
      recipient: recipientId,
      content: content.trim(),
      createdAt: new Date(),
    });

    await message.save();

    // Include profileImage in population
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username profileImage")
      .populate("recipient", "username profileImage");

    if (!populatedMessage) {
      throw new Error("Message could not be found after saving");
    }

    return res.status(201).json({
      _id: populatedMessage._id,
      content: populatedMessage.content,
      sender: populatedMessage.sender,
      recipient: populatedMessage.recipient,
      createdAt: populatedMessage.createdAt,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      error: "An error occurred while sending the message",
      details: error.message,
    });
  }
});

// Get conversation between two users
router.get("/conversation/:userId", authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user.id },
      ],
    })
      .sort({ createdAt: 1 })
      // Include profileImage in both sender and recipient population
      .populate("sender", "username profileImage")
      .populate("recipient", "username profileImage");

    res.json(messages);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the conversation" });
  }
});

router.get("/search", authenticateToken, async (req, res) => {
  try {
    const query = req.query.q;
    // Include profileImage in user search results
    const users = await User.find({
      username: { $regex: query, $options: "i" },
      _id: { $ne: req.user.id },
    }).select("username _id profileImage");

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get list of conversations for current user
// Get list of conversations for current user
router.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user.id);

    // First get all messages with proper population
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: currentUserId }, { recipient: currentUserId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", currentUserId] },
              then: "$recipient",
              else: "$sender",
            },
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      // Add lookup stages to properly populate user details
      {
        $lookup: {
          from: "users",
          localField: "lastMessage.sender",
          foreignField: "_id",
          as: "senderDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "lastMessage.recipient",
          foreignField: "_id",
          as: "recipientDetails",
        },
      },
      // Unwind the arrays created by lookup
      {
        $unwind: "$senderDetails",
      },
      {
        $unwind: "$recipientDetails",
      },
      // Project the final structure
      {
        $project: {
          _id: 1,
          lastMessage: {
            _id: "$lastMessage._id",
            content: "$lastMessage.content",
            createdAt: "$lastMessage.createdAt",
            sender: {
              _id: "$senderDetails._id",
              username: "$senderDetails.username",
              profileImage: "$senderDetails.profileImage",
            },
            recipient: {
              _id: "$recipientDetails._id",
              username: "$recipientDetails.username",
              profileImage: "$recipientDetails.profileImage",
            },
          },
        },
      },
    ]);

    // Transform the data into the expected format
    const conversations = messages.map((msg) => {
      const otherUser =
        msg.lastMessage.sender._id.toString() === req.user.id
          ? msg.lastMessage.recipient
          : msg.lastMessage.sender;

      return {
        _id: otherUser._id,
        participants: [msg.lastMessage.sender, msg.lastMessage.recipient],
        lastMessage: msg.lastMessage,
        username: otherUser.username,
        profileImage: otherUser.profileImage,
      };
    });

    res.json(conversations);
  } catch (error) {
    console.error("Error in conversations route:", error);
    res.status(500).json({
      error: "Failed to fetch conversations",
      details: error.message,
    });
  }
});

export default router;
