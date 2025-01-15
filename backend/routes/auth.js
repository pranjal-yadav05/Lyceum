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

const JWT_SECRET = process.env.JWT_SECRET; // Replace with a secure secret
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

console.log('Setting up passport strategy...');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  console.log('Google profile:', profile);
  console.log('Inside Google strategy callback...');
  
  try {
    const email = profile.emails[0].value;
    let user = await User.findOne({ email });

    if (!user) {
      // Generate username from the email (use the part before the @ symbol)
      const username = email.split('@')[0].toLowerCase();
      console.log('Generated username (before check):', username);  // Debugging log

      // Check if the generated username already exists
      let existingUser = await User.findOne({ username });
      let finalUsername = username;

      // If the username exists, append a number to make it unique
      let counter = 1;
      while (existingUser) {
        finalUsername = `${username}${counter}`;
        existingUser = await User.findOne({ username: finalUsername });
        counter++;
      }

      console.log('Final unique username:', finalUsername);  // Debugging log

      // Create new user with the generated username
      user = new User({
        email,
        name: profile.displayName,
        googleId: profile.id,
        username: finalUsername,  // Use the unique username
      });

      // Save the new user to the database
      await user.save();
      return done(null, user);
    }

    // If the user already exists, just return the existing user
    return done(null, user);
  } catch (err) {
    console.error('Error in Google Strategy:', err);
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
  const username = email.split('@')[0].toLowerCase();
  if (!user) {
    user = new User({ email, name, googleId: userId, username });
    await user.save();
  }

  // Generate JWT token and send it back
  const jwtToken = jwt.sign(
    { id: user._id, email, name, username },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token: jwtToken }); // Send JWT back to frontend
});


router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if the email or username already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

  
// Login Endpoint
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body; // "identifier" can be email or username

  try {
    // Check if identifier is an email or username
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const query = isEmail ? { email: identifier } : { username: identifier };

    // Find user by email or username
    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Validate password
    const isPasswordValid = await user.isPasswordValid(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expiration
    );

    res.json({ token });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.post('/logout', (req, res) => {
  res.clearCookie('token'); // Clear the cookie
  res.json({ message: 'Logged out successfully' });
});

export default router;