import mongoose from "mongoose";

const focusSoundSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FocusSoundCategory",
      required: true,
    },
    sourceUrl: { type: String, required: true, trim: true },
    youtubeId: { type: String, required: true, trim: true },
    icon: { type: String, default: "🔊", trim: true },
    defaultVolume: { type: Number, default: 50, min: 0, max: 100 },
    sortOrder: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const FocusSound = mongoose.model("FocusSound", focusSoundSchema);

export default FocusSound;
