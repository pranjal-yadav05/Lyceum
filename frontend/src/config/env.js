const raw = process.env.REACT_APP_API_URL;

/**
 * Browser REST base URL.
 * - Local: CRA `proxy` → use `/api` when env points at localhost (or is unset)
 * - Production: REACT_APP_API_URL → backend project "lyceum-server"
 *   (https://lyceum-server.vercel.app/api), not the frontend "lyceum" host.
 */
export const API_URL =
  process.env.NODE_ENV === "development" &&
  (!raw || raw === "http://localhost:5000/api")
    ? "/api"
    : raw || "";
