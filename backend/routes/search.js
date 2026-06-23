import express from "express";
import { buildSectionLabelMap } from "../utils/seedFocusSpaces.js";
import User from "../models/User.js";
import Topic from "../models/Topic.js";
import Post from "../models/Post.js";
import FocusSpaceEnvironment from "../models/FocusSpaceEnvironment.js";
import FocusSpaceSection from "../models/FocusSpaceSection.js";

const router = express.Router();
const LIMIT = 5;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Substring match (usernames, titles). */
function substringRegex(query) {
  return new RegExp(escapeRegex(query), "i");
}

/** Match only at the start of a word — avoids hidden hits like "stal" inside "Nostalgic". */
function wordStartRegex(query) {
  return new RegExp(`\\b${escapeRegex(query)}`, "i");
}

function truncate(text, max) {
  if (!text || text.length <= max) return text || "";
  return `${text.slice(0, max)}…`;
}

router.get("/", async (req, res) => {
  const query = req.query.q?.trim();
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }
  if (query.length > 50) {
    return res.status(400).json({ error: "Query must be 50 characters or less" });
  }

  const regex = substringRegex(query);
  const wordStart = wordStartRegex(query);

  try {
    const [users, topics, posts, focusSpaces, sectionDocs] = await Promise.all([
      User.find({ username: regex })
        .select("username profileImage coverImage")
        .limit(LIMIT)
        .lean(),
      Topic.find({
        $or: [{ title: regex }, { description: regex }, { category: regex }],
      })
        .select("title category author")
        .limit(LIMIT)
        .lean(),
      Post.find({ content: regex })
        .select("content author topicId createdAt")
        .sort({ createdAt: -1 })
        .limit(LIMIT)
        .populate("topicId", "title")
        .lean(),
      FocusSpaceEnvironment.find({
        enabled: true,
        $or: [{ title: regex }, { description: wordStart }],
      })
        .select("slug title description section")
        .populate("category", "label")
        .sort({ sortOrder: 1, title: 1 })
        .limit(LIMIT)
        .lean(),
      FocusSpaceSection.find({ enabled: true }).select("slug label").lean(),
    ]);

    const sectionLabelMap = buildSectionLabelMap(sectionDocs);

    res.json({
      users: users.map((user) => ({
        username: user.username,
        profileImage: user.profileImage,
        coverImage: user.coverImage,
      })),
      topics: topics.map((topic) => ({
        id: topic._id.toString(),
        title: topic.title,
        category: topic.category,
        author: topic.author,
      })),
      posts: posts
        .filter((post) => post.topicId)
        .map((post) => ({
          id: post._id.toString(),
          content: truncate(post.content, 120),
          author: post.author,
          topicId:
            typeof post.topicId === "object"
              ? post.topicId._id.toString()
              : post.topicId.toString(),
          topicTitle:
            typeof post.topicId === "object" ? post.topicId.title : null,
        })),
      focusSpaces: focusSpaces.map((env) => ({
        id: env.slug,
        title: env.title,
        description: truncate(env.description, 80),
        categoryLabel: env.category?.label ?? null,
        sectionLabel: sectionLabelMap[env.section] ?? null,
      })),
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

export default router;
