import mongoose from "mongoose";
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Ensures the username is unique
    trim: true, // Trims spaces around the username
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;
    },
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },

  profileImage: { type: String, default: null },
  coverImage: { type: String, default: null },

  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date },

  // Add friends and friend requests
  friendRequests: [{
    sender: String, // Change from senderId to sender (username)
    timestamp: { type: Date, default: Date.now }
  }],
  friends: [String]

}, {
  timestamps: true,
});

// Password validation method
userSchema.methods.isPasswordValid = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
