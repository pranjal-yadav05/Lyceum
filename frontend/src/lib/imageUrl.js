const DEFAULT_PROFILE = "/images/defaultProfile.jpg";
const DEFAULT_COVER = "/images/defaultCover.jpg";

/** Resolve avatar/cover URLs — handles full blob URLs, relative paths, and missing values. */
export function resolveImageUrl(url, type = "profile") {
  if (!url) {
    return type === "cover" ? DEFAULT_COVER : DEFAULT_PROFILE;
  }
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }
  return `${process.env.REACT_APP_API_URL}/${url.replace(/^\//, "")}`;
}

export function coverBackgroundStyle(coverUrl) {
  const resolved = resolveImageUrl(coverUrl, "cover");
  return {
    backgroundImage: `linear-gradient(rgba(26, 20, 37, 0.8), rgba(26, 20, 37, 0.8)), url(${resolved})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}
