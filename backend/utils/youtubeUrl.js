/**
 * Extract YouTube video ID from youtu.be, /watch, /live/, /embed/, /shorts/ URLs.
 */
export function parseYouTubeUrl(input) {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0]?.split("?")[0];
      return id?.length === 11 ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname.startsWith("/live/")) {
        const id = url.pathname.split("/live/")[1]?.split("/")[0]?.split("?")[0];
        return id?.length >= 11 ? id.slice(0, 11) : id || null;
      }
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }
      if (url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/embed/")[1]?.split("?")[0] || null;
      }
      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/shorts/")[1]?.split("?")[0] || null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
