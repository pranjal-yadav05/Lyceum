import { Server } from 'socket.io';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Post from './models/Post.js';  // You'll need to copy your Post model here

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Socket Server: Connected to MongoDB'))
  .catch((err) => console.error('Socket Server: MongoDB connection error:', err));

const io = new Server({
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join', (topicId) => {
    console.log(`User ${socket.id} joined topic: ${topicId}`);
    socket.join(topicId);
    
    // Fetch and send existing posts for this topic
    Post.find({ topicId })
      .then(posts => {
        socket.emit('posts', posts);
      })
      .catch(error => {
        console.error('Error fetching posts:', error);
      });
  });

  socket.on('createPost', async (postData) => {
    try {
      const post = new Post(postData);
      const savedPost = await post.save();
      io.to(postData.topicId).emit('newPost', savedPost);
    } catch (error) {
      console.error('Error creating post:', error);
      socket.emit('error', { message: 'Error creating post' });
    }
  });

  socket.on('updatePost', async (data) => {
    try {
      const updatedPost = await Post.findByIdAndUpdate(
        data.postId,
        { content: data.content },
        { new: true }
      );
      if (updatedPost) {
        io.to(updatedPost.topicId).emit('updatePost', updatedPost);
      }
    } catch (error) {
      console.error('Error updating post:', error);
      socket.emit('error', { message: 'Error updating post' });
    }
  });

  socket.on('deletePost', async (data) => {
    try {
      const deletedPost = await Post.findByIdAndDelete(data.postId);
      if (deletedPost) {
        io.to(deletedPost.topicId).emit('deletePost', { 
          postId: data.postId, 
          topicId: deletedPost.topicId 
        });
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      socket.emit('error', { message: 'Error deleting post' });
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log(`User ${socket.id} disconnected. Reason: ${reason}`);
  });
});

const PORT = process.env.SOCKET_PORT || 5001;
io.listen(PORT);
console.log(`Socket.IO server running on port ${PORT}`);

