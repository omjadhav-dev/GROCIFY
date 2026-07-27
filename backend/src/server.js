const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup for real-time chat
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Serve uploaded product images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const chatRoutes = require('./routes/chatRoutes');
const profileRoutes = require('./routes/profileRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Grocify API is running' });
});

// Socket.IO - Real-time chat logic
// Store online users: userId -> socketId
const onlineUsers = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // User joins with their userId
  socket.on('user_online', (userId) => {
    onlineUsers[userId] = socket.id;
    console.log(`User ${userId} is online`);
  });

  // Handle sending a message
  socket.on('send_message', (data) => {
    // data = { senderId, receiverId, message, conversationId }
    const receiverSocketId = onlineUsers[data.receiverId];
    if (receiverSocketId) {
      // Send to receiver in real-time
      io.to(receiverSocketId).emit('receive_message', data);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    // Remove user from online list
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        console.log(`User ${userId} went offline`);
        break;
      }
    }
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
