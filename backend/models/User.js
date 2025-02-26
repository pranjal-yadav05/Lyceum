import mongoose from "mongoose";
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
{

  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
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
  friendRequests: [{
    sender: String,
    timestamp: { type: Date, default: Date.now }
  }],
  friends: [String],
  visitorCount: { 

    type: Number,
    default: 0
  }
}, {
  timestamps: true

});

// Password validation method
userSchema.methods.isPasswordValid = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
