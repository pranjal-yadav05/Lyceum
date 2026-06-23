import mongoose from "mongoose";

const focusSpaceSectionSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FocusSpaceCategory",
      required: true,
    },
    sortOrder: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

focusSpaceSectionSchema.index({ category: 1, slug: 1 }, { unique: true });

const FocusSpaceSection = mongoose.model(
  "FocusSpaceSection",
  focusSpaceSectionSchema
);

export default FocusSpaceSection;
