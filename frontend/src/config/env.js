const raw = process.env.REACT_APP_API_URL;

/** Same-origin /api in dev (via package.json proxy) so auth cookies persist. */
export const API_URL =
  process.env.NODE_ENV === "development" &&
  (!raw || raw === "http://localhost:5000/api")
    ? "/api"
    : raw || "";
