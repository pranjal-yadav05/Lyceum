const raw = process.env.REACT_APP_API_URL;

/**
 * Resolve the REST API base URL for browser calls.
 * Production always uses same-origin `/api` (frontend vercel.json rewrites to
 * lyceum-server) so browsers never hit cross-origin CORS against the API host.
 */
function resolveApiUrl() {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    return `${window.location.origin}/api`;
  }

  // Local CRA: same-origin /api via package.json proxy.
  if (
    process.env.NODE_ENV === "development" &&
    (!raw || raw === "http://localhost:5000/api")
  ) {
    return "/api";
  }

  // SSR / build-time fallback
  if (typeof window !== "undefined") {
    if (!raw || raw.includes("lyceum-server.vercel.app")) {
      return `${window.location.origin}/api`;
    }
  }

  return raw || "";
}

export const API_URL = resolveApiUrl();
