import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Define the user schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // Ensures that the email is unique
    lowercase: true, // Ensures the email is stored in lowercase
    trim: true, // Trims spaces around the email
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if the user is not logging in via Google
      return !this.googleId; // if googleId is not set, then password is required
    },
  },
  googleId: {
    type: String,  // For Google OAuth user identification
    unique: true,  // Ensure googleId is unique
  },
}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields
});
userSchema.methods.isPasswordValid = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};
// Create and export the User model
const User = mongoose.model('User', userSchema);

export default User;
