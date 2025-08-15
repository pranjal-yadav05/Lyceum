import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { generateToken, blacklistToken } from "../utils/tokenManager.js";
import { auditLogger } from "../middleware/auditLogger.js";

const router = express.Router();
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Apply audit logging to all auth routes
router.use(auditLogger);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });

        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
          return done(null, user);
        }

        const username = await generateUniqueUsername(
          email.split("@")[0].toLowerCase()
        );
        user = new User({
          email,
          name: profile.displayName,
          googleId: profile.id,
          username,
        });
        await user.save();
        return done(null, user);
      } catch (err) {
        console.error("Error in Google Strategy:", err);
        return done(err, null);
      }
    }
  )
);

async function generateUniqueUsername(baseUsername) {
  let username = baseUsername;
  let counter = 1;
  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }
  return username;
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
  }
);

router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = payload.sub;
        await user.save();
      }
    } else {
      const username = await generateUniqueUsername(
        email.split("@")[0].toLowerCase()
      );
      user = new User({
        email,
        name: payload.name,
        googleId: payload.sub,
        username,
      });
      await user.save();
    }

    const jwtToken = generateToken(user);
    res.json({ token: jwtToken });
  } catch (error) {
    console.error("Google authentication error:", error);
    res.status(401).json({ error: "Invalid Google token" });
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    const token = generateToken(user);

    // Clear session and cookies before sending response
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
        res.clearCookie("connect.sid");
        res
          .status(201)
          .json({ message: "User registered successfully", token });
      });
    } else {
      res.status(201).json({ message: "User registered successfully", token });
    }
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
    req.session.user = user;

    res.json({
      token,
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
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      await blacklistToken(token);
    }
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
