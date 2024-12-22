import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import postRoutes from './routes/posts.js';
import authRoutes from './routes/auth.js';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import session from 'express-session';
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL, // Allow all origins or specify your client URL
    methods: ["GET", "POST"],
    credentials:true,
  },
});

app.use(cors({
  origin: process.env.FRONTEND_URL, // Allow requests only from your frontend
  credentials: true, // Allow cookies to be sent
}));

app.use(session({
  secret: 'secret', // Replace with a strong secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' } // Use secure cookies in production
}))


app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Use routes
app.use('/api/posts', postRoutes);
app.use('/api/auth',authRoutes);

app.get('/',(req,res)=>{
  res.send("Welcome to server....");
})


io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a room
  socket.on('join-room', ({ roomId, userId }) => {

    if (!roomId || !userId) {
      console.error('Invalid roomId or userId');
      return;
    }

    socket.join(roomId); // Ensure the user joins the room
    console.log(`User ${userId} joined room: ${roomId}`);

    // Notify the newly connected user about existing users in the room
    const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []).filter(
      (id) => id !== socket.id // Exclude the current user
    );
    socket.emit('existing-users', usersInRoom);

    // Notify other users in the room about the new user
    socket.to(roomId).emit('user-connected', userId);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });

  // Relay WebRTC signaling data
  socket.on('signal', ({ to, data }) => {
    console.log(`Signal from ${socket.id} to ${to}`, data);
    io.to(to).emit('signal', { from: socket.id, data });
  });
});

const PORT = process.env.PORT;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));