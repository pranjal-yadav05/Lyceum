/**
 * YouTube IFrame Player API helpers.
 *
 * Use www.youtube.com (not youtube-nocookie.com) with the JS API — the widget
 * script loads from youtube.com and postMessage routing breaks on nocookie +
 * localhost, flooding the console with origin mismatch warnings.
 */
export const YOUTUBE_PLAYER_HOST =
  process.env.REACT_APP_YOUTUBE_PLAYER_HOST || "https://www.youtube.com";

let ytApiPromise = null;

function buildEmbedSrc(videoId, playerVars) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(playerVars)) {
    if (value == null) continue;
    params.set(key, String(value));
  }
  return `${YOUTUBE_PLAYER_HOST}/embed/${videoId}?${params.toString()}`;
}

export function loadYouTubeIframeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API requires browser"));
  }
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    window.YTConfig = {
      host: `${YOUTUBE_PLAYER_HOST}/iframe_api`,
    };

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = `${YOUTUBE_PLAYER_HOST}/iframe_api`;
    document.head.appendChild(tag);
  });

  return ytApiPromise;
}

/**
 * Create a player from a pre-built iframe (recommended for reliable postMessage).
 */
export function createYouTubeIframePlayer(
  YT,
  mountEl,
  { videoId, playerVars = {}, width = "100%", height = "100%", events }
) {
  const iframe = document.createElement("iframe");
  iframe.title = "YouTube player";
  iframe.width = width;
  iframe.height = height;
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute(
    "allow",
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  );
  iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  iframe.src = buildEmbedSrc(videoId, {
    enablejsapi: 1,
    origin: window.location.origin,
    ...playerVars,
  });
  mountEl.appendChild(iframe);

  return new YT.Player(iframe, { events });
}

export function getYouTubeEmbedUrl(videoId, playerVars = {}) {
  if (!videoId) return null;
  return buildEmbedSrc(videoId, {
    enablejsapi: 1,
    origin: typeof window !== "undefined" ? window.location.origin : undefined,
    ...playerVars,
  });
}
