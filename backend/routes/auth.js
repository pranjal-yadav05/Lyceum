import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';

const router = express.Router();
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    let user = await User.findOne({ email });

    if (user) {
      // If user exists but doesn't have googleId, update it
      if (!user.googleId) {
        user.googleId = profile.id;
        await user.save();
      }
      return done(null, user);
    }

    // If user doesn't exist, create new user
    const username = await generateUniqueUsername(email.split('@')[0].toLowerCase());
    user = new User({
      email,
      name: profile.displayName,
      googleId: profile.id,
      username,
    });
    await user.save();
    return done(null, user);
  } catch (err) {
    console.error('Error in Google Strategy:', err);
    return done(err, null);
  }
}));

// Helper function to generate unique username
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

// Google Sign-In routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
  }
);

// Handle Google token verification from frontend
// Endpoint to link existing account with Google
router.post('/link-account', async (req, res) => {
  try {
    const { email, password, googleToken } = req.body;
    
    // Verify user credentials
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isPasswordValid = await user.isPasswordValid(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // Link Google account
    await user.linkGoogleAccount(payload.sub);
    
    res.json({ message: 'Account successfully linked with Google' });
  } catch (error) {
    console.error('Account linking error:', error);
    res.status(500).json({ error: 'Failed to link account' });
  }
});

router.post('/google', async (req, res) => {
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
      // If user has password but no Google ID, suggest linking
      if (user.password && !user.googleId) {
        return res.status(200).json({ 
          token: generateToken(user),
          suggestLinking: true 
        });
      }
      
      // Update existing user with Google ID if not present
      if (!user.googleId) {
        user.googleId = payload.sub;
        await user.save();
      }

    } else {
      // Create new user if doesn't exist
      const username = await generateUniqueUsername(email.split('@')[0].toLowerCase());
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
    console.error('Google authentication error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});



router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

export default router;
