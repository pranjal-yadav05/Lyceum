import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js'; // Adjust to your User model
const router = express.Router();
dotenv.config();

const JWT_SECRET = 'Lyceum'; // Replace with a secure secret
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await User.findOne({ email: profile.emails[0].value });
    if (!user) {
      // If the user doesn't exist, register a new user without a password
      const newUser = new User({
        email: profile.emails[0].value,
        name: profile.displayName,
        googleId: profile.id,
      });
      await newUser.save();
      return done(null, newUser);
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));


passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Google Sign-In route
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google Sign-In callback route
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

    // Send token as response (frontend will handle it)
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
  }
);

router.post('/google', async (req, res) => {
  const { token } = req.body;

  // Verify the token with Google
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID, // Google Client ID
  });

  const payload = ticket.getPayload();
  const userId = payload.sub;
  const email = payload.email;
  const name = payload.name;

  // Find or create user in your database
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({ email, name, googleId: userId });
    await user.save();
  }

  // Generate JWT token and send it back
  const jwtToken = jwt.sign(
    { id: user._id, email, name },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token: jwtToken }); // Send JWT back to frontend
});


router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ error: 'Email already in use' });
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ email, password: hashedPassword });
      await user.save();
      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  
// Login Endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate user credentials (simplified example)
  const user = await User.findOne({ email });
  if (!user || !user.isPasswordValid(password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT
  const token = jwt.sign({ id: user._id, email: user.email }, 'your-secret-key', {
    expiresIn: '1h', // Token expiration
  });

  res.json({ token });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token'); // Clear the cookie
  res.json({ message: 'Logged out successfully' });
});

export default router;