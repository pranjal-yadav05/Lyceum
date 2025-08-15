import express from "express";
import User from "../models/User.js";
import { authenticateToken } from "../middleware/authenticateToken.js";

const router = express.Router();

// Get all users
router.get("/", authenticateToken, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send Friend Request
router.post("/send", authenticateToken, async (req, res) => {
  const { senderId, receiverId } = req.body; // these will be usernames now

  try {
    const receiver = await User.findOne({ username: receiverId });
    if (!receiver) return res.status(404).json({ error: "User not found" });

    // Check if a request already exists using username
    const alreadyRequested = receiver.friendRequests.some(
      (req) => req.sender === senderId // store username instead of ID
    );
    if (alreadyRequested) {
      return res.status(400).json({ error: "Friend request already sent" });
    }

    // Add the friend request with username
    receiver.friendRequests.push({ sender: senderId });
    await receiver.save();

    res.status(200).json({ message: "Friend request sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Accept Friend Request
router.post("/accept", authenticateToken, async (req, res) => {
  const { senderId, receiverId } = req.body; // these will be usernames

  try {
    const receiver = await User.findOne({ username: receiverId });
    const sender = await User.findOne({ username: senderId });

    if (!receiver || !sender)
      return res.status(404).json({ error: "User not found" });

    // Check if the request exists
    const requestIndex = receiver.friendRequests.findIndex(
      (req) => req.sender === senderId
    );
    if (requestIndex === -1) {
      return res.status(400).json({ error: "Friend request not found" });
    }

    // Add each other as friends using username
    receiver.friends.push(sender.username);
    sender.friends.push(receiver.username);

    // Remove the friend request
    receiver.friendRequests.splice(requestIndex, 1);

    await receiver.save();
    await sender.save();

    res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Decline Friend Request
router.post("/decline", authenticateToken, async (req, res) => {
  const { senderId, receiverId } = req.body; // these will be usernames

  try {
    const receiver = await User.findOne({ username: receiverId });
    if (!receiver) return res.status(404).json({ error: "User not found" });

    // Remove the friend request using username
    receiver.friendRequests = receiver.friendRequests.filter(
      (req) => req.sender !== senderId
    );
    await receiver.save();

    res.status(200).json({ message: "Friend request declined" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Get Friends
router.get("/friends/:username", authenticateToken, async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).populate(
      "friends",
      "username profileImage"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    const friendsDetails = await User.find({
      username: { $in: user.friends },
    });

    res.status(200).json(friendsDetails);
  } catch (err) {
    console.error("Error fetching friends:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Get Friend Requests
router.get("/requests/:username", authenticateToken, async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Since we need sender's profile image, we need to fetch those users
    const requestsWithProfiles = await Promise.all(
      user.friendRequests.map(async (request) => {
        const senderProfile = await User.findOne(
          { username: request.sender },
          "username profileImage"
        );
        return {
          _id: request._id,
          sender: request.sender,
          timestamp: request.timestamp,
          senderProfile: senderProfile,
        };
      })
    );

    res.status(200).json(requestsWithProfiles);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Remove Friend Request
router.post("/remove-request", authenticateToken, async (req, res) => {
  const { senderId, receiverId } = req.body; // these will be usernames

  try {
    const receiver = await User.findOne({ username: receiverId });
    if (!receiver) return res.status(404).json({ error: "User not found" });

    // Remove the friend request using username
    receiver.friendRequests = receiver.friendRequests.filter(
      (req) => req.sender !== senderId
    );
    await receiver.save();

    res.status(200).json({ message: "Friend request removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Check Friend Request Status
router.get(
  "/request-status/:senderId/:receiverId",
  authenticateToken,
  async (req, res) => {
    const { senderId, receiverId } = req.params;

    try {
      const receiver = await User.findOne({ username: receiverId });
      if (!receiver) return res.status(404).json({ error: "User not found" });

      const requestSent = receiver.friendRequests.some(
        (req) => req.sender === senderId
      );

      res.status(200).json({ requestSent });
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
);

export default router;
