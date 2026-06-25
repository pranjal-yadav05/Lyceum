import { API_URL } from "../config/env";

const LOGIN_URI = `${API_URL}/auth/google/callback`;

let initialized = false;

export function waitForGoogleScript(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google.accounts.id);
      return;
    }

    const started = Date.now();
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        resolve(window.google.accounts.id);
      } else if (Date.now() - started > timeoutMs) {
        clearInterval(interval);
        reject(new Error("Google Sign-In script failed to load"));
      }
    }, 100);
  });
}

export function ensureGoogleAuthInitialized() {
  if (initialized || !window.google?.accounts?.id) return;
  window.google.accounts.id.initialize({
    client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    ux_mode: "redirect",
    login_uri: LOGIN_URI,
  });
  initialized = true;
}

export function renderGoogleButton(container, options) {
  ensureGoogleAuthInitialized();
  container.innerHTML = "";
  window.google.accounts.id.renderButton(container, options);
}
