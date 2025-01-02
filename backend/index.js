import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import session from 'express-session';
import { createServer } from 'http';
import { Server } from 'socket.io';
import postRoutes from './routes/posts.js';
import authRoutes from './routes/auth.js';
import topicRoutes from './routes/topics.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Middleware setup
const middlewares = [
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
  }),
  cookieParser(),
  express.json(),
  session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    },
  }),
  passport.initialize(),
  passport.session(),
];

middlewares.forEach((middleware) => app.use(middleware));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/posts', postRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', topicRoutes);

app.get('/', (req, res) => res.send("Welcome to the server..."));

// Setup Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const rooms = new Map();
const roomMessages = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomId, userId, username, mediaState }) => {
    if (!roomId || !userId || !username) {
      console.error('Invalid roomId, userId or username');
      return;
    }

    // Remove any existing connections for this user
    if (rooms.has(roomId)) {
      const existingUser = Array.from(rooms.get(roomId).entries()).find(([_, user]) => user.username === username);
      if (existingUser) {
        const [existingUserId, _] = existingUser;
        rooms.get(roomId).delete(existingUserId);
        socket.to(roomId).emit('user-disconnected', { userId: existingUserId, username });
      }
    }

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }

    // Store the user's details
    rooms.get(roomId).set(userId, { username, mediaState, socketId: socket.id });

    socket.join(roomId);
    console.log(`User ${username} (ID: ${userId}) joined room: ${roomId}`);

    // Emit to all users in the room except the sender
    socket.to(roomId).emit('user-connected', { userId, username, mediaState });

    // Emit the current users in the room to the newly joined user
    const usersInRoom = Array.from(rooms.get(roomId), ([id, data]) => ({
      userId: id,
      username: data.username,
      mediaState: data.mediaState
    }));
    socket.emit('room-users', usersInRoom);

    // Send existing messages to the newly joined user
    if (roomMessages.has(roomId)) {
      socket.emit('room-messages', roomMessages.get(roomId));
    }
  });

  socket.on('media-state-changed', ({ roomId, userId, mediaState }) => {
    if (rooms.has(roomId) && rooms.get(roomId).has(userId)) {
      rooms.get(roomId).get(userId).mediaState = mediaState;
      socket.to(roomId).emit('media-state-changed', { userId, mediaState });
    }
  });

  socket.on('send-message', ({ roomId, userId, username, message }) => {
    const messageData = { userId, username, message, timestamp: Date.now() };
    
    // Store the message
    if (!roomMessages.has(roomId)) {
      roomMessages.set(roomId, []);
    }
    roomMessages.get(roomId).push(messageData);

    // Limit stored messages to last 100
    if (roomMessages.get(roomId).length > 100) {
      roomMessages.get(roomId).shift();
    }

    io.to(roomId).emit('receive-message', messageData);
  });

  socket.on('disconnect', () => {
    rooms.forEach((users, roomId) => {
      users.forEach((user, userId) => {
        if (socket.id === user.socketId) {
          console.log(`User ${user.username} (ID: ${userId}) disconnected from room ${roomId}`);
          users.delete(userId);
          socket.to(roomId).emit('user-disconnected', { userId, username: user.username });

          // If room is empty, delete its messages
          if (users.size === 0) {
            roomMessages.delete(roomId);
            rooms.delete(roomId);
          }
        }
      });
    });
  });
});

// Start the combined server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server (API + Socket.IO) running on port ${PORT}`));

