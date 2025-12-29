const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import logger
const logger = require('./utils/logger');

// Import socket handlers
const { initializeChatSocket } = require('./socket/chatSocket');

// Import rate limiters
const {
  generalLimiter,
  authLimiter,
  orderLimiter,
  uploadLimiter,
  webhookLimiter,
} = require('./middleware/rateLimit');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const uploadRoutes = require('./routes/upload');
const blogRoutes = require('./routes/blogs');
const newsletterRoutes = require('./routes/newsletter');
const couponRoutes = require('./routes/coupons');
const promotionRoutes = require('./routes/promotions');
const chatRoutes = require('./routes/chats');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize chat socket
initializeChatSocket(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all API routes
app.use('/api', generalLimiter);

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes with specific rate limiters
app.use('/api/auth', authLimiter, authRoutes); // Stricter for auth
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderLimiter, orderRoutes); // Limit order creation
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes); // Limit uploads
app.use('/api/blogs', blogRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/chats', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Flower Shop API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.logError(err, req);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flower-shop';
const PORT = process.env.PORT || 5000;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info('Socket.io enabled for real-time chat');
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', { error: err.message });
    process.exit(1);
  });
