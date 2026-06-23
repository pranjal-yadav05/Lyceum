import express from "express";
import FocusSoundCategory from "../models/FocusSoundCategory.js";
import FocusSound from "../models/FocusSound.js";
import { isAdmin } from "../middleware/adminAuth.js";
import { parseYouTubeUrl, slugify } from "../utils/youtubeUrl.js";
import {
  ensureFocusSoundsSeeded,
  reconcileFocusCatalog,
} from "../utils/seedFocusSounds.js";

const router = express.Router();

router.use(isAdmin);

router.get("/catalog", async (_req, res) => {
  try {
    await ensureFocusSoundsSeeded();
    await reconcileFocusCatalog();

    const [categories, sounds] = await Promise.all([
      FocusSoundCategory.find().sort({ sortOrder: 1, label: 1 }),
      FocusSound.find()
        .populate("category", "slug label")
        .sort({ sortOrder: 1, title: 1 }),
    ]);

    res.json({ categories, sounds });
  } catch (error) {
    console.error("Admin focus sounds catalog error:", error);
    res.status(500).json({ error: "Failed to load catalog" });
  }
});

router.post("/categories", async (req, res) => {
  try {
    const { label, sortOrder = 0, enabled = true } = req.body;
    if (!label?.trim()) {
      return res.status(400).json({ error: "Label is required" });
    }

    let slug = slugify(label);
    if (await FocusSoundCategory.exists({ slug })) {
      slug = `${slug}-${Date.now()}`;
    }

    const category = await FocusSoundCategory.create({
      slug,
      label: label.trim(),
      sortOrder: Number(sortOrder) || 0,
      enabled: enabled !== false,
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("Create sound category error:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

router.patch("/categories/:id", async (req, res) => {
  try {
    const { label, sortOrder, enabled } = req.body;
    const updates = {};
    if (label !== undefined) updates.label = label.trim();
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder);
    if (enabled !== undefined) updates.enabled = Boolean(enabled);

    const category = await FocusSoundCategory.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    console.error("Update sound category error:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    const soundCount = await FocusSound.countDocuments({ category: req.params.id });
    if (soundCount > 0) {
      return res.status(400).json({
        error: "Remove or reassign sounds in this category first",
      });
    }

    const category = await FocusSoundCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Category deleted" });
  } catch (error) {
    console.error("Delete sound category error:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

router.post("/sounds", async (req, res) => {
  try {
    const {
      title,
      description = "",
      categoryId,
      sourceUrl,
      icon = "🔊",
      defaultVolume = 50,
      sortOrder = 0,
      enabled = true,
    } = req.body;

    if (!title?.trim() || !categoryId || !sourceUrl?.trim()) {
      return res.status(400).json({
        error: "Title, category, and YouTube URL are required",
      });
    }

    const category = await FocusSoundCategory.findById(categoryId);
    if (!category) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const youtubeId = parseYouTubeUrl(sourceUrl);
    if (!youtubeId) {
      return res.status(400).json({ error: "Could not parse YouTube URL or video ID" });
    }

    let slug = slugify(title);
    if (await FocusSound.exists({ slug })) {
      slug = `${slug}-${Date.now()}`;
    }

    const sound = await FocusSound.create({
      slug,
      title: title.trim(),
      description: description.trim(),
      category: categoryId,
      sourceUrl: sourceUrl.trim(),
      youtubeId,
      icon: icon.trim() || "🔊",
      defaultVolume: Math.min(100, Math.max(0, Number(defaultVolume) || 50)),
      sortOrder: Number(sortOrder) || 0,
      enabled: enabled !== false,
    });

    await sound.populate("category", "slug label");
    res.status(201).json(sound);
  } catch (error) {
    console.error("Create sound error:", error);
    res.status(500).json({ error: "Failed to create sound" });
  }
});

router.patch("/sounds/:id", async (req, res) => {
  try {
    const {
      title,
      description,
      categoryId,
      sourceUrl,
      icon,
      defaultVolume,
      sortOrder,
      enabled,
    } = req.body;

    const sound = await FocusSound.findById(req.params.id);
    if (!sound) {
      return res.status(404).json({ error: "Sound not found" });
    }

    if (title !== undefined) sound.title = title.trim();
    if (description !== undefined) sound.description = description.trim();
    if (categoryId !== undefined) {
      const category = await FocusSoundCategory.findById(categoryId);
      if (!category) {
        return res.status(400).json({ error: "Invalid category" });
      }
      sound.category = categoryId;
    }
    if (sourceUrl !== undefined) {
      const youtubeId = parseYouTubeUrl(sourceUrl);
      if (!youtubeId) {
        return res.status(400).json({ error: "Could not parse YouTube URL" });
      }
      sound.sourceUrl = sourceUrl.trim();
      sound.youtubeId = youtubeId;
    }
    if (icon !== undefined) sound.icon = icon.trim() || "🔊";
    if (defaultVolume !== undefined) {
      sound.defaultVolume = Math.min(100, Math.max(0, Number(defaultVolume) || 0));
    }
    if (sortOrder !== undefined) sound.sortOrder = Number(sortOrder);
    if (enabled !== undefined) sound.enabled = Boolean(enabled);

    await sound.save();
    await sound.populate("category", "slug label");
    res.json(sound);
  } catch (error) {
    console.error("Update sound error:", error);
    res.status(500).json({ error: "Failed to update sound" });
  }
});

router.delete("/sounds/:id", async (req, res) => {
  try {
    const sound = await FocusSound.findByIdAndDelete(req.params.id);
    if (!sound) {
      return res.status(404).json({ error: "Sound not found" });
    }
    res.json({ message: "Sound deleted" });
  } catch (error) {
    console.error("Delete sound error:", error);
    res.status(500).json({ error: "Failed to delete sound" });
  }
});

export default router;
