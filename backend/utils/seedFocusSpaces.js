import FocusSpaceCategory from "../models/FocusSpaceCategory.js";
import FocusSpaceEnvironment from "../models/FocusSpaceEnvironment.js";
import FocusSpaceSection from "../models/FocusSpaceSection.js";
import FocusSoundCategory from "../models/FocusSoundCategory.js";
import FocusSound from "../models/FocusSound.js";
import { parseYouTubeUrl, slugify } from "./youtubeUrl.js";

/**
 * Canonical catalog derived from each stream's actual YouTube title/content.
 * Re-synced by youtubeId so existing DB rows get corrected titles and categories.
 */

export const CANONICAL_SPACE_CATEGORIES = [
  { slug: "lofi-beats", label: "Lo-Fi & Beats", sortOrder: 1, useSections: false },
  { slug: "calm-night-series", label: "7-Eleven Series", sortOrder: 2, useSections: false },
  { slug: "live-views", label: "Live Views", sortOrder: 3, useSections: true },
];

export const CANONICAL_SPACE_SECTIONS = [
  { categorySlug: "live-views", slug: "city", label: "City", sortOrder: 1 },
  { categorySlug: "live-views", slug: "waterfront", label: "Waterfront", sortOrder: 2 },
];

/** @deprecated Use DB-backed sections; kept as fallback for legacy rows. */
export const FOCUS_SPACE_SECTION_LABELS = {
  city: "City",
  waterfront: "Waterfront",
};

export const FOCUS_SPACE_SECTION_ORDER = ["city", "waterfront"];

export function buildSectionLabelMap(sections = []) {
  const map = { ...FOCUS_SPACE_SECTION_LABELS };
  for (const section of sections) {
    if (section.slug && section.label) {
      map[section.slug] = section.label;
    }
  }
  return map;
}

export function getFocusSpaceSectionLabel(section, labelMap = FOCUS_SPACE_SECTION_LABELS) {
  if (!section) return null;
  return labelMap[section] ?? null;
}

export const CALM_NIGHT_SERIES = [
  {
    title: "A Quiet 7-Eleven Above the City",
    description: "Dreamy rain lofi above the city. Fall asleep to quiet store ambience.",
    sourceUrl: "https://youtu.be/GlX0pK9_tEY",
    sortOrder: 1,
  },
  {
    title: "Rainy Walk to the Konbini",
    description: "Cozy lofi for a calm walk to the convenience store in the rain.",
    sourceUrl: "https://youtu.be/CegiQ1TyhNY",
    sortOrder: 2,
  },
  {
    title: "Beneath the Railway Lights",
    description: "Nostalgic rain lofi under railway lights. Ease anxiety and slow down.",
    sourceUrl: "https://youtu.be/OkVFUANGkZg",
    sortOrder: 3,
  },
  {
    title: "Japanese Side Street at Midnight",
    description: "Midnight side street rain lofi to settle restless thoughts.",
    sourceUrl: "https://youtu.be/ga70RA_4a_0",
    sortOrder: 4,
  },
  {
    title: "Nobody Drives This Road at 2am",
    description: "Melancholic rain lofi on an empty road. For loneliness and stress.",
    sourceUrl: "https://youtu.be/RTJyRLgeVCs",
    sortOrder: 5,
  },
  {
    title: "Above the City, Finally Breathing",
    description: "Rain lofi above the city skyline. Let go and breathe.",
    sourceUrl: "https://youtu.be/ezzo973AR1g",
    sortOrder: 6,
  },
  {
    title: "3AM on a Tokyo Rooftop",
    description: "Late-night Tokyo rooftop rain lofi to drift off to sleep.",
    sourceUrl: "https://youtu.be/MS6eKQU-uKc",
    sortOrder: 7,
  },
  {
    title: "One Last Stop Before Sleep",
    description: "Rainy night lofi for rest, focus, and winding down.",
    sourceUrl: "https://youtu.be/u_6WkPfhFMI",
    sortOrder: 8,
  },
  {
    title: "The City Can't Reach Me Here",
    description: "Rain lofi tucked away from the city. Stress relief and quiet focus.",
    sourceUrl: "https://youtu.be/mdn081wZzqE",
    sortOrder: 9,
  },
  {
    title: "Sitting in the Car Until the Rain Stops",
    description: "Japan rain lofi from inside the car. Wait out the storm in peace.",
    sourceUrl: "https://youtu.be/MQG_Frn8MeQ",
    sortOrder: 10,
  },
  {
    title: "It's 2AM at a Tokyo 7-Eleven",
    description: "Late-night Tokyo konbini rain lofi for insomnia and calm focus.",
    sourceUrl: "https://youtu.be/hQVZaEF7veM",
    sortOrder: 11,
  },
];

export const CANONICAL_VISUAL_SPACES = [
  ...CALM_NIGHT_SERIES.map((entry) => ({
    ...entry,
    categorySlug: "calm-night-series",
  })),
  {
    title: "Tokyo Live with Lofi Jazz",
    description:
      "Live Tokyo city view with soft lofi and jazz in the background.",
    categorySlug: "live-views",
    section: "city",
    sourceUrl: "https://www.youtube.com/live/_k-5U7IeK8g",
    sortOrder: 1,
  },
  {
    title: "Seoul Han River Lofi",
    description:
      "24/7 Hangang river live view with lofi for study and relaxation.",
    categorySlug: "live-views",
    section: "city",
    sourceUrl: "https://www.youtube.com/live/jF8-FvIj4-E",
    sortOrder: 2,
  },
  {
    title: "Sydney Harbour Live",
    description: "24/7 harbour webcam. Open water, ferries, and city skyline.",
    categorySlug: "live-views",
    section: "waterfront",
    sourceUrl: "https://www.youtube.com/live/5uZa3-RMFos",
    sortOrder: 1,
  },
  {
    title: "Dublin Bay Harbour Live",
    description: "Live harbour view. Ships entering and leaving Dublin Port.",
    categorySlug: "live-views",
    section: "waterfront",
    sourceUrl: "https://www.youtube.com/live/oxx7MqjhOpw",
    sortOrder: 2,
  },
];

export const CANONICAL_SOUND_CATEGORIES = [
  { slug: "lofi-layers", label: "Lo-Fi Layers", sortOrder: 1 },
];

/** Audio-first streams mixed in-room, not full-screen backgrounds */
export const CANONICAL_SOUNDS = [
  {
    title: "Calming Lofi Rain",
    description: "Rain ambience with chill lofi beats for focus and study.",
    categorySlug: "lofi-layers",
    sourceUrl: "https://www.youtube.com/live/vYIYIVmOo3Q",
    icon: "🌧️",
    defaultVolume: 45,
    sortOrder: 1,
  },
  {
    title: "Chill Lofi Beats",
    description: "Cozy lofi beats to relax or study to.",
    categorySlug: "lofi-layers",
    sourceUrl: "https://www.youtube.com/live/92PvEVG0sKI",
    icon: "🎧",
    defaultVolume: 40,
    sortOrder: 2,
  },
];

const SOUND_ONLY_YOUTUBE_IDS = new Set(
  CANONICAL_SOUNDS.map((s) => parseYouTubeUrl(s.sourceUrl)).filter(Boolean)
);

/** Owner disabled embedding or retired from catalog */
const BLOCKED_EMBED_YOUTUBE_IDS = ["vk5BHoDxXf0", "uEQ7fH7ViXo"];

async function ensureCategories(Model, canonical) {
  const map = {};
  for (const cat of canonical) {
    let doc = await Model.findOne({ slug: cat.slug });
    if (!doc) {
      doc = await Model.create({ ...cat, enabled: true });
    } else if (doc.label !== cat.label || doc.sortOrder !== cat.sortOrder) {
      doc.label = cat.label;
      doc.sortOrder = cat.sortOrder;
      await doc.save();
    }
    map[cat.slug] = doc._id;
  }
  return map;
}

async function upsertSection(section, categoryMap) {
  const categoryId = categoryMap[section.categorySlug];
  if (!categoryId) return;

  let doc = await FocusSpaceSection.findOne({
    category: categoryId,
    slug: section.slug,
  });

  if (doc) {
    doc.label = section.label;
    doc.sortOrder = section.sortOrder;
    doc.enabled = true;
    await doc.save();
    return;
  }

  await FocusSpaceSection.create({
    slug: section.slug,
    label: section.label,
    category: categoryId,
    sortOrder: section.sortOrder,
    enabled: true,
  });
}

async function upsertVisualSpace(env, categoryMap) {
  const youtubeId = parseYouTubeUrl(env.sourceUrl);
  if (!youtubeId) return;

  const categoryId = categoryMap[env.categorySlug];
  if (!categoryId) return;

  let doc = await FocusSpaceEnvironment.findOne({ youtubeId });
  if (doc) {
    doc.title = env.title;
    doc.description = env.description;
    doc.category = categoryId;
    doc.sourceUrl = env.sourceUrl;
    doc.section = env.section ?? null;
    doc.sortOrder = env.sortOrder;
    doc.enabled = true;
    await doc.save();
    return;
  }

  const baseSlug = slugify(env.title);
  let slug = baseSlug;
  let n = 1;
  while (await FocusSpaceEnvironment.exists({ slug })) {
    slug = `${baseSlug}-${n++}`;
  }

  await FocusSpaceEnvironment.create({
    slug,
    title: env.title,
    description: env.description,
    category: categoryId,
    sourceUrl: env.sourceUrl,
    youtubeId,
    section: env.section ?? null,
    type: "youtube",
    accent: "from-purple-500/40 to-indigo-700/40",
    sortOrder: env.sortOrder,
    enabled: true,
  });
}

async function upsertSound(sound, categoryMap) {
  const youtubeId = parseYouTubeUrl(sound.sourceUrl);
  if (!youtubeId) return;

  const categoryId = categoryMap[sound.categorySlug];
  if (!categoryId) return;

  let doc = await FocusSound.findOne({ youtubeId });
  if (doc) {
    doc.title = sound.title;
    doc.description = sound.description;
    doc.category = categoryId;
    doc.sourceUrl = sound.sourceUrl;
    doc.icon = sound.icon;
    doc.defaultVolume = sound.defaultVolume;
    doc.sortOrder = sound.sortOrder;
    doc.enabled = true;
    await doc.save();
    return;
  }

  const baseSlug = slugify(sound.title);
  let slug = baseSlug;
  let n = 1;
  while (await FocusSound.exists({ slug })) {
    slug = `${baseSlug}-${n++}`;
  }

  await FocusSound.create({
    slug,
    title: sound.title,
    description: sound.description,
    category: categoryId,
    sourceUrl: sound.sourceUrl,
    youtubeId,
    icon: sound.icon,
    defaultVolume: sound.defaultVolume,
    sortOrder: sound.sortOrder,
    enabled: true,
  });
}

/** Disable legacy categories replaced by the canonical catalog. */
async function disableLegacyCategories() {
  const legacySpaceSlugs = [
    "nature",
    "cozy",
    "deep-focus",
    "urban",
    "city-live",
    "waterfront",
  ];
  const legacySoundSlugs = ["nature", "noise", "urban"];

  await FocusSpaceCategory.updateMany(
    { slug: { $in: legacySpaceSlugs } },
    { enabled: false }
  );
  await FocusSoundCategory.updateMany(
    { slug: { $in: legacySoundSlugs } },
    { enabled: false }
  );
}

async function disableBlockedEmbeds() {
  if (BLOCKED_EMBED_YOUTUBE_IDS.length === 0) return;
  await FocusSpaceEnvironment.updateMany(
    { youtubeId: { $in: BLOCKED_EMBED_YOUTUBE_IDS } },
    { enabled: false }
  );
}

async function disableMisplacedVisuals() {
  if (SOUND_ONLY_YOUTUBE_IDS.size === 0) return;
  await FocusSpaceEnvironment.updateMany(
    { youtubeId: { $in: [...SOUND_ONLY_YOUTUBE_IDS] } },
    { enabled: false }
  );
}

export async function ensureFocusSpacesSeeded() {
  const categoryCount = await FocusSpaceCategory.countDocuments();
  if (categoryCount === 0) {
    await reconcileFocusCatalog();
    return true;
  }
  return false;
}

export async function ensureFocusSoundsSeeded() {
  const categoryCount = await FocusSoundCategory.countDocuments();
  if (categoryCount === 0) {
    await reconcileFocusCatalog();
    return true;
  }
  return false;
}

/** Upsert canonical metadata by YouTube ID (safe to run on every catalog fetch). */
export async function reconcileFocusCatalog() {
  const spaceCategoryMap = await ensureCategories(
    FocusSpaceCategory,
    CANONICAL_SPACE_CATEGORIES
  );
  const soundCategoryMap = await ensureCategories(
    FocusSoundCategory,
    CANONICAL_SOUND_CATEGORIES
  );

  for (const env of CANONICAL_VISUAL_SPACES) {
    await upsertVisualSpace(env, spaceCategoryMap);
  }

  for (const section of CANONICAL_SPACE_SECTIONS) {
    await upsertSection(section, spaceCategoryMap);
  }

  for (const sound of CANONICAL_SOUNDS) {
    await upsertSound(sound, soundCategoryMap);
  }

  await disableMisplacedVisuals();
  await disableBlockedEmbeds();
  await disableLegacyCategories();
}

export const ACCENT_PRESETS = [
  { label: "Purple", value: "from-purple-500/40 to-indigo-700/40" },
  { label: "Pink Lo-Fi", value: "from-pink-500/40 to-purple-600/40" },
  { label: "Amber", value: "from-amber-500/40 to-orange-600/40" },
  { label: "Forest", value: "from-green-600/40 to-emerald-800/40" },
  { label: "Ocean", value: "from-cyan-500/40 to-teal-700/40" },
  { label: "Slate Rain", value: "from-slate-500/40 to-blue-700/40" },
  { label: "Fire", value: "from-orange-600/40 to-red-800/40" },
  { label: "Snow", value: "from-blue-300/30 to-slate-600/40" },
  { label: "Café", value: "from-amber-700/40 to-yellow-900/40" },
  { label: "Neon City", value: "from-fuchsia-500/40 to-purple-900/40" },
  { label: "Neutral", value: "from-neutral-600/40 to-neutral-900/40" },
];
