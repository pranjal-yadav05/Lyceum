import mongoose from "mongoose";

const focusSpaceEnvironmentSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FocusSpaceCategory",
      required: true,
    },
    sourceUrl: { type: String, required: true, trim: true },
    youtubeId: { type: String, required: true, trim: true },
    type: { type: String, enum: ["youtube", "url"], default: "youtube" },
    accent: {
      type: String,
      default: "from-purple-500/40 to-indigo-700/40",
    },
    sortOrder: { type: Number, default: 0 },
    section: { type: String, default: null, trim: true },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const FocusSpaceEnvironment = mongoose.model(
  "FocusSpaceEnvironment",
  focusSpaceEnvironmentSchema
);

export default FocusSpaceEnvironment;
