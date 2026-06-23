import mongoose from "mongoose";

const focusSoundCategorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const FocusSoundCategory = mongoose.model(
  "FocusSoundCategory",
  focusSoundCategorySchema
);

export default FocusSoundCategory;
