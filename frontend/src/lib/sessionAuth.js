const TOKEN_KEY = "token";
const USERNAME_KEY = "username";
const USER_ID_KEY = "userId";

function parseJwtPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function normalizeAuthUser(apiUser, token) {
  const decoded = token ? parseJwtPayload(token) : null;
  const id = apiUser?.id ?? apiUser?._id ?? decoded?.id ?? null;
  const username = apiUser?.username ?? decoded?.username ?? "";
  const email = apiUser?.email ?? decoded?.email ?? "";
  const role = apiUser?.role ?? decoded?.role ?? "user";

  if (!id && !username) return null;

  return {
    id,
    username,
    email,
    role,
    profileImage: apiUser?.profileImage ?? null,
  };
}

export function persistLegacyToken(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  if (user?.username) localStorage.setItem(USERNAME_KEY, user.username);
  if (user?.id ?? user?._id) {
    localStorage.setItem(USER_ID_KEY, String(user.id ?? user._id));
  }
}

export function clearLegacyToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

export function readLegacySession() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const user = normalizeAuthUser(null, token);
  if (!user) {
    clearLegacyToken();
    return null;
  }

  return { user, socketToken: token };
}

export function getLegacyToken() {
  return localStorage.getItem(TOKEN_KEY);
}
