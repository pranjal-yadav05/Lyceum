const raw = process.env.REACT_APP_API_URL;

function resolveProductionApiUrl() {
  if (typeof window === "undefined") return raw || "";
  // GIS redirect requires login_uri on the frontend origin (see vercel.json /api proxy).
  if (!raw || raw.includes("lyceum-server.vercel.app")) {
    return `${window.location.origin}/api`;
  }
  return raw;
}

/** Same-origin /api in dev (CRA proxy). Production uses frontend /api proxy when needed. */
export const API_URL =
  process.env.NODE_ENV === "development" &&
  (!raw || raw === "http://localhost:5000/api")
    ? "/api"
    : resolveProductionApiUrl();

export function getGoogleLoginUri() {
  const base = API_URL.startsWith("http")
    ? API_URL
    : `${window.location.origin}${API_URL}`;
  return `${base.replace(/\/$/, "")}/auth/google/callback`;
}
