import mongoose from "mongoose";

const focusSpaceCategorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    useSections: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const FocusSpaceCategory = mongoose.model(
  "FocusSpaceCategory",
  focusSpaceCategorySchema
);

export default FocusSpaceCategory;
