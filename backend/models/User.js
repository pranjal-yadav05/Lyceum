import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
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
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  isLinkedAccount: {
    type: Boolean,
    default: false
  },
  linkedAt: {
    type: Date,
    default: null
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
  timestamps: true,
});

// Method to link Google account
userSchema.methods.linkGoogleAccount = async function(googleId) {
  this.googleId = googleId;
  this.isLinkedAccount = true;
  this.linkedAt = new Date();
  await this.save();
};

// Method to check if account is linked
userSchema.methods.isAccountLinked = function() {
  return this.isLinkedAccount && this.googleId !== null;
};

const User = mongoose.model('User', userSchema);
export default User;
