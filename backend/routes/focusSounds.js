import express from "express";
import FocusSoundCategory from "../models/FocusSoundCategory.js";
import FocusSound from "../models/FocusSound.js";
import {
  ensureFocusSoundsSeeded,
  reconcileFocusCatalog,
} from "../utils/seedFocusSounds.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    await ensureFocusSoundsSeeded();
    await reconcileFocusCatalog();

    const [categories, sounds] = await Promise.all([
      FocusSoundCategory.find({ enabled: true }).sort({ sortOrder: 1, label: 1 }),
      FocusSound.find({ enabled: true })
        .populate("category", "slug label sortOrder")
        .sort({ sortOrder: 1, title: 1 }),
    ]);

    res.json({
      categories: categories.map((c) => ({
        id: c.slug,
        _id: c._id,
        label: c.label,
        sortOrder: c.sortOrder,
      })),
      sounds: sounds.map((s) => ({
        id: s.slug,
        _id: s._id,
        title: s.title,
        description: s.description,
        category: s.category?.slug ?? null,
        categoryLabel: s.category?.label ?? null,
        youtubeId: s.youtubeId,
        sourceUrl: s.sourceUrl,
        icon: s.icon,
        defaultVolume: s.defaultVolume,
        sortOrder: s.sortOrder,
      })),
    });
  } catch (error) {
    console.error("Error fetching focus sounds:", error);
    res.status(500).json({ error: "Failed to load focus sounds" });
  }
});

export default router;
