import express from "express";
import User from "../models/User.js";
import { authenticateToken } from "../middleware/authenticateToken.js";

const router = express.Router();

// Get all users (public profile fields only)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select("username profileImage");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Send Friend Request
router.post("/send", authenticateToken, async (req, res) => {
  const senderId = req.user.username;
  const { receiverId } = req.body;

  try {
    if (senderId === receiverId) {
      return res.status(400).json({ error: "Cannot friend yourself" });
    }

    const receiver = await User.findOne({ username: receiverId });
    if (!receiver) return res.status(404).json({ error: "User not found" });

    const alreadyRequested = receiver.friendRequests.some(
      (r) => r.sender === senderId
    );
    if (alreadyRequested) {
      return res.status(400).json({ error: "Friend request already sent" });
    }

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
  const receiverId = req.user.username;
  const { senderId } = req.body;

  try {
    const receiver = await User.findOne({ username: receiverId });
    const sender = await User.findOne({ username: senderId });

    if (!receiver || !sender)
      return res.status(404).json({ error: "User not found" });

    const requestIndex = receiver.friendRequests.findIndex(
      (r) => r.sender === senderId
    );
    if (requestIndex === -1) {
      return res.status(400).json({ error: "Friend request not found" });
    }

    receiver.friends.push(sender.username);
    sender.friends.push(receiver.username);

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
  const receiverId = req.user.username;
  const { senderId } = req.body;

  try {
    const receiver = await User.findOne({ username: receiverId });
    if (!receiver) return res.status(404).json({ error: "User not found" });

    receiver.friendRequests = receiver.friendRequests.filter(
      (r) => r.sender !== senderId
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

  if (req.user.username !== username) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const friendsDetails = await User.find({
      username: { $in: user.friends },
    }).select("username profileImage");

    res.status(200).json(friendsDetails);
  } catch (err) {
    console.error("Error fetching friends:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Get Friend Requests
router.get("/requests/:username", authenticateToken, async (req, res) => {
  const { username } = req.params;

  if (req.user.username !== username) {
    return res.status(403).json({ error: "Forbidden" });
  }

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

// Remove an existing friendship (unfriend)
router.post("/remove-friend", authenticateToken, async (req, res) => {
  const myUsername = req.user.username;
  const { friendUsername } = req.body;

  try {
    const me = await User.findOne({ username: myUsername });
    const friend = await User.findOne({ username: friendUsername });

    if (!me || !friend) return res.status(404).json({ error: "User not found" });

    me.friends = me.friends.filter((f) => f !== friendUsername);
    friend.friends = friend.friends.filter((f) => f !== myUsername);

    await me.save();
    await friend.save();

    res.status(200).json({ message: "Friend removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Remove Friend Request (sender cancels their own outbound request)
router.post("/remove-request", authenticateToken, async (req, res) => {
  const senderId = req.user.username;
  const { receiverId } = req.body;

  try {
    const receiver = await User.findOne({ username: receiverId });
    if (!receiver) return res.status(404).json({ error: "User not found" });

    receiver.friendRequests = receiver.friendRequests.filter(
      (r) => r.sender !== senderId
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
