import express from "express";
import FocusSpaceCategory from "../models/FocusSpaceCategory.js";
import FocusSpaceEnvironment from "../models/FocusSpaceEnvironment.js";
import FocusSpaceSection from "../models/FocusSpaceSection.js";
import {
  ensureFocusSpacesSeeded,
  reconcileFocusCatalog,
  buildSectionLabelMap,
} from "../utils/seedFocusSpaces.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    await ensureFocusSpacesSeeded();
    await reconcileFocusCatalog();

    const [categories, sections, environments] = await Promise.all([
      FocusSpaceCategory.find({ enabled: true }).sort({ sortOrder: 1, label: 1 }),
      FocusSpaceSection.find({ enabled: true })
        .populate("category", "slug label sortOrder useSections")
        .sort({ sortOrder: 1, label: 1 }),
      FocusSpaceEnvironment.find({ enabled: true })
        .populate("category", "slug label sortOrder useSections")
        .sort({ sortOrder: 1, title: 1 }),
    ]);

    const sectionLabelMap = buildSectionLabelMap(sections);

    res.json({
      categories: categories.map((c) => ({
        id: c.slug,
        _id: c._id,
        label: c.label,
        sortOrder: c.sortOrder,
        useSections: c.useSections,
      })),
      sections: sections.map((s) => ({
        id: s.slug,
        _id: s._id,
        label: s.label,
        category: s.category?.slug ?? null,
        sortOrder: s.sortOrder,
      })),
      environments: environments.map((e) => ({
        id: e.slug,
        _id: e._id,
        title: e.title,
        description: e.description,
        category: e.category?.slug ?? null,
        categoryLabel: e.category?.label ?? null,
        section: e.section ?? null,
        sectionLabel: getFocusSpaceSectionLabel(e.section, sectionLabelMap),
        type: e.type,
        youtubeId: e.youtubeId,
        sourceUrl: e.sourceUrl,
        accent: e.accent,
        sortOrder: e.sortOrder,
      })),
    });
  } catch (error) {
    console.error("Error fetching focus spaces:", error);
    res.status(500).json({ error: "Failed to load focus spaces" });
  }
});

function getFocusSpaceSectionLabel(section, labelMap) {
  if (!section) return null;
  return labelMap[section] ?? null;
}

router.get("/:slug", async (req, res) => {
  try {
    const environment = await FocusSpaceEnvironment.findOne({
      slug: req.params.slug,
      enabled: true,
    }).populate("category", "slug label");

    if (!environment) {
      return res.status(404).json({ error: "Environment not found" });
    }

    res.json({
      id: environment.slug,
      title: environment.title,
      description: environment.description,
      category: environment.category?.slug ?? null,
      categoryLabel: environment.category?.label ?? null,
      type: environment.type,
      youtubeId: environment.youtubeId,
      sourceUrl: environment.sourceUrl,
      accent: environment.accent,
    });
  } catch (error) {
    console.error("Error fetching focus space:", error);
    res.status(500).json({ error: "Failed to load environment" });
  }
});

export default router;
