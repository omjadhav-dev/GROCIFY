const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

dotenv.config();

const { sequelize } = require('./models');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Socket.IO setup for real-time chat
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: CLIENT_URL }));
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
const onlineUsers = {}; // userId -> socketId

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('user_online', (userId) => {
    onlineUsers[userId] = socket.id;
  });

  socket.on('send_message', (data) => {
    // data = { senderId, receiverId, message }
    const receiverSocketId = onlineUsers[data.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_message', data);
    }
  });

  socket.on('disconnect', () => {
    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

// Connect to MySQL, sync models, then start the server
sequelize
  .authenticate()
  .then(() => {
    console.log('MySQL connected successfully');
    // sync() creates tables that don't exist yet based on the models above.
    // Use migrations instead of sync({ alter: true }) once this goes to production.
    return sequelize.sync();
  })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MySQL connection error:', err.message);
    process.exit(1);
  });
