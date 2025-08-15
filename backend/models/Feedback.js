import mongoose from "mongoose";

// Add a user field to store the username or user ID of the feedback submitter
const FeedbackSchema = new mongoose.Schema({
  feedback: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  reviewed: {
    type: Boolean,
    default: false,
  },
});

const Feedback = mongoose.model("Feedback", FeedbackSchema);
export default Feedback;
