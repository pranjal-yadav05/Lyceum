const raw = process.env.REACT_APP_API_URL;

function resolveApiUrl() {
  // Local CRA: same-origin /api via package.json proxy.
  if (
    process.env.NODE_ENV === "development" &&
    (!raw || raw === "http://localhost:5000/api")
  ) {
    return "/api";
  }

  // Production: prefer same-origin /api (vercel.json rewrite → lyceum-server)
  // so browsers never hit cross-origin CORS against the API host.
  if (typeof window !== "undefined") {
    if (!raw || raw.includes("lyceum-server.vercel.app")) {
      return `${window.location.origin}/api`;
    }
  }

  return raw || "";
}

export const API_URL = resolveApiUrl();
