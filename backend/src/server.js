// src/server.js
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/post');
const skillCardRoutes = require('./routes/skillCard');
const gigRoutes = require('./routes/gig');
const messageRoutes = require('./routes/message');
const errorHandler = require('./middleware/errorHandler');
const { verifyToken } = require('./middleware/auth');
const Message = require('./models/Message');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Middlewares ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// ---------- Safe route attach ----------
const safeUse = (path, router) => {
  if (!router) return;
  if (typeof router === 'function' || (router && typeof router.use === 'function')) {
    app.use(path, router);
  } else {
    console.warn(`⚠️ Skipped invalid router at path: ${path}`);
  }
};

safeUse('/api/auth', authRoutes);
safeUse('/api/posts', postRoutes);
safeUse('/api/skills', skillCardRoutes);
safeUse('/api/gigs', gigRoutes);
safeUse('/api/messages', messageRoutes);

// ---------- 404 & error handlers ----------
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});
app.use(errorHandler);

// ---------- Socket.io setup ----------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token provided'));
  try {
    const user = verifyToken(token);
    socket.user = user;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.id}`);
  socket.join(socket.user.id);

  socket.on('sendMessage', async ({ receiver, content }) => {
    try {
      if (!receiver || !content) return;
      const msg = await Message.create({
        sender: socket.user.id,
        receiver,
        content,
      });
      io.to(receiver).emit('newMessage', msg);
      socket.emit('newMessage', msg);
    } catch (err) {
      console.error('sendMessage error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.id}`);
  });
});

// ---------- Start Server ----------
const start = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') start();

module.exports = app;
