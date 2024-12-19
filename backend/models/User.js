import mongoose from 'mongoose';

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
    required: true, // Password is required
  },
}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields
});

// Create and export the User model
const User = mongoose.model('User', userSchema);

export default User;
