// src/server.js
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

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

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/skills', skillCardRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/messages', messageRoutes);

// 404
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(errorHandler);

// create server + socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

// socket auth
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));
  try {
    const user = verifyToken(token);
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// socket events
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.id}`);
  socket.join(socket.user.id);

  socket.on('sendMessage', async ({ receiver, content }) => {
    if (!receiver || !content) return;

    const msg = await Message.create({
      sender: socket.user.id,
      receiver,
      content,
    });

    io.to(receiver).emit('newMessage', msg);
    socket.emit('newMessage', msg);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.id}`);
  });
});

// start
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    const shutdown = (signal) => {
      console.log(`Received ${signal}. Closing server...`);
      server.close(() => {
        console.log('Server closed. Exiting process.');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception thrown', err);
      server.close(() => process.exit(1));
    });

  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

start();
