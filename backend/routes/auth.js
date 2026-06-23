import express from "express";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { generateToken, blacklistToken } from "../utils/tokenManager.js";
import { auditLogger } from "../middleware/auditLogger.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.use(authRateLimiter);

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const SESSION_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_COOKIE_MAX_AGE_MS,
    path: "/",
  });
}

async function generateUniqueUsername(baseUsername) {
  let username = baseUsername;
  let counter = 1;
  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }
  return username;
}

// Apply audit logging to all auth routes
router.use(auditLogger);

// Google Identity Services callback (ux_mode: redirect / response_mode: form_post).
// Google POSTs the credential here as application/x-www-form-urlencoded, with a
// double-submit g_csrf_token cookie + body field for CSRF protection.
router.post("/google/callback", async (req, res) => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;
  try {
    const bodyCsrf = req.body?.g_csrf_token;
    const cookieCsrf = req.cookies?.g_csrf_token;
    if (!bodyCsrf || !cookieCsrf || bodyCsrf !== cookieCsrf) {
      return res.redirect(`${loginUrl}?error=csrf`);
    }

    const credential = req.body?.credential;
    if (!credential) {
      return res.redirect(`${loginUrl}?error=no_credential`);
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email });
    if (user) {
      if (!user.googleId) {
        user.googleId = payload.sub;
        await user.save();
      }
    } else {
      const username = await generateUniqueUsername(
        payload.email.split("@")[0].toLowerCase()
      );
      user = new User({
        email: payload.email,
        name: payload.name,
        googleId: payload.sub,
        username,
      });
      await user.save();
    }

    const jwtToken = generateToken(user);
    setAuthCookie(res, jwtToken);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error("Google callback error:", error);
    res.redirect(`${loginUrl}?error=google_failed`);
  }
});

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.googleId) {
        return res.status(400).json({
          error:
            "Email already registered with Google. Please use Google Sign-In.",
        });
      }
      return res.status(400).json({ error: "Email already in use" });
    }

    if (await User.findOne({ username })) {
      return res.status(400).json({ error: "Username already in use" });
    }

    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const user = new User({
      username,
      email,
      password,
    });

    await user.save();

    const token = generateToken(user);
    setAuthCookie(res, token);
    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/check-user", async (req, res) => {
  const { identifier } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.json({ exists: false });
    }

    res.json({
      exists: true,
      authMethod: user.googleId ? "google" : "password",
    });
  } catch (error) {
    res.status(500).json({ error: "Error checking user" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const query = isEmail ? { email: identifier } : { username: identifier };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.googleId) {
      return res.status(403).json({
        error: "This account uses Google Sign-In. Please log in with Google.",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Logout route
router.post("/logout", async (req, res) => {
  try {
    const token =
      req.cookies?.token ?? req.headers.authorization?.split(" ")[1];
    if (token) {
      await blacklistToken(token);
    }
    res.clearCookie("token", { path: "/" });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
