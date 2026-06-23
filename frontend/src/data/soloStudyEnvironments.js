/** Shared embed flags for chrome-free ambient YouTube backgrounds */
export function isYouTubeLiveSource(sourceUrl) {
  return typeof sourceUrl === "string" && /youtube\.com\/live\//i.test(sourceUrl);
}

/** Full-screen ambient video — loops VOD, continuous for live */
export function getYouTubeAmbientPlayerVars(youtubeId, { isLive = false } = {}) {
  const vars = {
    autoplay: 1,
    mute: 1,
    controls: 0,
    disablekb: 1,
    fs: 0,
    iv_load_policy: 3,
    modestbranding: 1,
    playsinline: 1,
    rel: 0,
    cc_load_policy: 0,
  };

  if (!isLive && youtubeId) {
    vars.loop = 1;
    vars.playlist = youtubeId;
  }

  return vars;
}

/** Audio mix layers — never loop; live streams stay live, VOD plays once */
export function getYouTubeSoundPlayerVars(youtubeId, sourceUrl) {
  return getYouTubeAmbientPlayerVars(youtubeId, {
    isLive: isYouTubeLiveSource(sourceUrl),
  });
}

export function getYouTubePosterUrl(youtubeId) {
  if (!youtubeId) return null;
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}
