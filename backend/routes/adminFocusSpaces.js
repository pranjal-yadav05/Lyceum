import express from "express";
import FocusSpaceCategory from "../models/FocusSpaceCategory.js";
import FocusSpaceEnvironment from "../models/FocusSpaceEnvironment.js";
import FocusSpaceSection from "../models/FocusSpaceSection.js";
import { isAdmin } from "../middleware/adminAuth.js";
import { parseYouTubeUrl, slugify } from "../utils/youtubeUrl.js";
import {
  ACCENT_PRESETS,
  ensureFocusSpacesSeeded,
  reconcileFocusCatalog,
} from "../utils/seedFocusSpaces.js";

const router = express.Router();

router.use(isAdmin);

async function applySortOrder(Model, ids, filter = {}) {
  const updates = ids.map((id, index) =>
    Model.findOneAndUpdate({ _id: id, ...filter }, { sortOrder: index }, { new: true })
  );
  const results = await Promise.all(updates);
  if (results.some((doc) => !doc)) {
    throw new Error("One or more items not found");
  }
}

router.get("/meta", (_req, res) => {
  res.json({ accentPresets: ACCENT_PRESETS });
});

router.get("/catalog", async (_req, res) => {
  try {
    await ensureFocusSpacesSeeded();
    await reconcileFocusCatalog();

    const [categories, sections, environments] = await Promise.all([
      FocusSpaceCategory.find().sort({ sortOrder: 1, label: 1 }),
      FocusSpaceSection.find()
        .populate("category", "slug label")
        .sort({ sortOrder: 1, label: 1 }),
      FocusSpaceEnvironment.find()
        .populate("category", "slug label")
        .sort({ sortOrder: 1, title: 1 }),
    ]);

    res.json({ categories, sections, environments });
  } catch (error) {
    console.error("Admin focus catalog error:", error);
    res.status(500).json({ error: "Failed to load catalog" });
  }
});

router.post("/reorder", async (req, res) => {
  try {
    const { entity, ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids array is required" });
    }

    if (entity === "categories") {
      await applySortOrder(FocusSpaceCategory, ids);
    } else if (entity === "sections") {
      const first = await FocusSpaceSection.findById(ids[0]);
      if (!first) {
        return res.status(404).json({ error: "Section not found" });
      }
      await applySortOrder(FocusSpaceSection, ids, { category: first.category });
    } else if (entity === "environments") {
      await applySortOrder(FocusSpaceEnvironment, ids);
    } else {
      return res.status(400).json({ error: "Invalid entity type" });
    }

    res.json({ message: "Order updated" });
  } catch (error) {
    console.error("Reorder error:", error);
    res.status(500).json({ error: "Failed to reorder items" });
  }
});

// --- Categories ---

router.post("/categories", async (req, res) => {
  try {
    const { label, sortOrder = 0, useSections = false, enabled = true } = req.body;
    if (!label?.trim()) {
      return res.status(400).json({ error: "Label is required" });
    }

    let slug = slugify(label);
    if (await FocusSpaceCategory.exists({ slug })) {
      slug = `${slug}-${Date.now()}`;
    }

    const category = await FocusSpaceCategory.create({
      slug,
      label: label.trim(),
      sortOrder: Number(sortOrder) || 0,
      useSections: Boolean(useSections),
      enabled: enabled !== false,
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

router.patch("/categories/:id", async (req, res) => {
  try {
    const { label, sortOrder, useSections, enabled } = req.body;
    const updates = {};
    if (label !== undefined) updates.label = label.trim();
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder);
    if (useSections !== undefined) updates.useSections = Boolean(useSections);
    if (enabled !== undefined) updates.enabled = Boolean(enabled);

    const category = await FocusSpaceCategory.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    const [envCount, sectionCount] = await Promise.all([
      FocusSpaceEnvironment.countDocuments({ category: req.params.id }),
      FocusSpaceSection.countDocuments({ category: req.params.id }),
    ]);
    if (envCount > 0 || sectionCount > 0) {
      return res.status(400).json({
        error: "Remove or reassign rooms and sections in this category first",
      });
    }

    const category = await FocusSpaceCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Category deleted" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// --- Sections ---

router.post("/sections", async (req, res) => {
  try {
    const { label, categoryId, sortOrder = 0, enabled = true } = req.body;
    if (!label?.trim() || !categoryId) {
      return res.status(400).json({ error: "Label and category are required" });
    }

    const category = await FocusSpaceCategory.findById(categoryId);
    if (!category) {
      return res.status(400).json({ error: "Invalid category" });
    }

    let slug = slugify(label);
    if (await FocusSpaceSection.exists({ category: categoryId, slug })) {
      slug = `${slug}-${Date.now()}`;
    }

    const section = await FocusSpaceSection.create({
      slug,
      label: label.trim(),
      category: categoryId,
      sortOrder: Number(sortOrder) || 0,
      enabled: enabled !== false,
    });

    await section.populate("category", "slug label");
    await FocusSpaceCategory.findByIdAndUpdate(categoryId, { useSections: true });
    res.status(201).json(section);
  } catch (error) {
    console.error("Create section error:", error);
    res.status(500).json({ error: "Failed to create section" });
  }
});

router.patch("/sections/:id", async (req, res) => {
  try {
    const { label, categoryId, sortOrder, enabled } = req.body;
    const section = await FocusSpaceSection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ error: "Section not found" });
    }

    if (label !== undefined) section.label = label.trim();
    if (categoryId !== undefined) {
      const category = await FocusSpaceCategory.findById(categoryId);
      if (!category) {
        return res.status(400).json({ error: "Invalid category" });
      }
      section.category = categoryId;
    }
    if (sortOrder !== undefined) section.sortOrder = Number(sortOrder);
    if (enabled !== undefined) section.enabled = Boolean(enabled);

    await section.save();
    await section.populate("category", "slug label");
    res.json(section);
  } catch (error) {
    console.error("Update section error:", error);
    res.status(500).json({ error: "Failed to update section" });
  }
});

router.delete("/sections/:id", async (req, res) => {
  try {
    const section = await FocusSpaceSection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ error: "Section not found" });
    }

    const envCount = await FocusSpaceEnvironment.countDocuments({
      category: section.category,
      section: section.slug,
    });
    if (envCount > 0) {
      return res.status(400).json({
        error: "Reassign or remove rooms in this section first",
      });
    }

    await FocusSpaceSection.findByIdAndDelete(req.params.id);
    res.json({ message: "Section deleted" });
  } catch (error) {
    console.error("Delete section error:", error);
    res.status(500).json({ error: "Failed to delete section" });
  }
});

// --- Environments ---

router.post("/environments", async (req, res) => {
  try {
    const {
      title,
      description = "",
      categoryId,
      section = null,
      sourceUrl,
      accent,
      sortOrder = 0,
      enabled = true,
    } = req.body;

    if (!title?.trim() || !categoryId || !sourceUrl?.trim()) {
      return res.status(400).json({
        error: "Title, category, and YouTube URL are required",
      });
    }

    const category = await FocusSpaceCategory.findById(categoryId);
    if (!category) {
      return res.status(400).json({ error: "Invalid category" });
    }

    if (section) {
      const sectionDoc = await FocusSpaceSection.findOne({
        category: categoryId,
        slug: section,
      });
      if (!sectionDoc) {
        return res.status(400).json({ error: "Invalid section for this category" });
      }
    }

    const youtubeId = parseYouTubeUrl(sourceUrl);
    if (!youtubeId) {
      return res.status(400).json({ error: "Could not parse YouTube URL or video ID" });
    }

    let slug = slugify(title);
    if (await FocusSpaceEnvironment.exists({ slug })) {
      slug = `${slug}-${Date.now()}`;
    }

    const environment = await FocusSpaceEnvironment.create({
      slug,
      title: title.trim(),
      description: description.trim(),
      category: categoryId,
      section: section || null,
      sourceUrl: sourceUrl.trim(),
      youtubeId,
      type: "youtube",
      accent: accent || ACCENT_PRESETS[0].value,
      sortOrder: Number(sortOrder) || 0,
      enabled: enabled !== false,
    });

    await environment.populate("category", "slug label");
    res.status(201).json(environment);
  } catch (error) {
    console.error("Create environment error:", error);
    res.status(500).json({ error: "Failed to create environment" });
  }
});

router.patch("/environments/:id", async (req, res) => {
  try {
    const {
      title,
      description,
      categoryId,
      section,
      sourceUrl,
      accent,
      sortOrder,
      enabled,
    } = req.body;

    const environment = await FocusSpaceEnvironment.findById(req.params.id);
    if (!environment) {
      return res.status(404).json({ error: "Environment not found" });
    }

    if (title !== undefined) environment.title = title.trim();
    if (description !== undefined) environment.description = description.trim();
    if (categoryId !== undefined) {
      const category = await FocusSpaceCategory.findById(categoryId);
      if (!category) {
        return res.status(400).json({ error: "Invalid category" });
      }
      environment.category = categoryId;
    }
    if (section !== undefined) {
      if (section) {
        const categoryRef = categoryId || environment.category;
        const sectionDoc = await FocusSpaceSection.findOne({
          category: categoryRef,
          slug: section,
        });
        if (!sectionDoc) {
          return res.status(400).json({ error: "Invalid section for this category" });
        }
      }
      environment.section = section || null;
    }
    if (sourceUrl !== undefined) {
      const youtubeId = parseYouTubeUrl(sourceUrl);
      if (!youtubeId) {
        return res.status(400).json({ error: "Could not parse YouTube URL" });
      }
      environment.sourceUrl = sourceUrl.trim();
      environment.youtubeId = youtubeId;
    }
    if (accent !== undefined) environment.accent = accent;
    if (sortOrder !== undefined) environment.sortOrder = Number(sortOrder);
    if (enabled !== undefined) environment.enabled = Boolean(enabled);

    await environment.save();
    await environment.populate("category", "slug label");
    res.json(environment);
  } catch (error) {
    console.error("Update environment error:", error);
    res.status(500).json({ error: "Failed to update environment" });
  }
});

router.delete("/environments/:id", async (req, res) => {
  try {
    const environment = await FocusSpaceEnvironment.findByIdAndDelete(
      req.params.id
    );
    if (!environment) {
      return res.status(404).json({ error: "Environment not found" });
    }
    res.json({ message: "Environment deleted" });
  } catch (error) {
    console.error("Delete environment error:", error);
    res.status(500).json({ error: "Failed to delete environment" });
  }
});

export default router;
