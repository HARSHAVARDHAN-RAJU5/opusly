require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");
const helmet = require("helmet");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/post");
const skillCardRoutes = require("./routes/skillCard");
const gigRoutes = require("./routes/gig");
const messageRoutes = require("./routes/message");
const errorHandler = require("./middleware/errorHandler");
const { verifyToken } = require("./middleware/auth");
const Message = require("./models/Message");

const app = express();
const PORT = process.env.PORT || 5000;

// -------------------- Middlewares --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

// 🔍 log every incoming request (for debugging)
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} [REQ] ${req.method} ${req.originalUrl}`
  );
  next();
});

// 🩷 temporary health check endpoint
app.get("/api/ping", (req, res) => {
  console.log("Ping received ✅");
  res.json({ ok: true, ts: Date.now() });
});

// -------------------- Routes --------------------
const safeUse = (path, router) => {
  if (!router) return;
  if (typeof router === "function" || (router && typeof router.use === "function")) {
    app.use(path, router);
  } else {
    console.warn(`⚠️ Skipped invalid router at path: ${path}`);
  }
};

safeUse("/api/auth", authRoutes);
safeUse("/api/posts", postRoutes);
safeUse("/api/skillcard", skillCardRoutes); // ✅ lowercase path
safeUse("/api/gigs", gigRoutes);
safeUse("/api/messages", messageRoutes);

// -------------------- Not Found + Error Handling --------------------
app.use((req, res, next) => {
  console.log(`❌ 404 Not Found: ${req.originalUrl}`);
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});
app.use(errorHandler);

// -------------------- Socket.io Setup --------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const onlineUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token provided"));
  try {
    const user = verifyToken(token);
    socket.user = user;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.user.id;
  onlineUsers.set(userId, socket.id);
  console.log(`✅ ${userId} connected`);
  io.emit("onlineUsers", Array.from(onlineUsers.keys()));

  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    console.log(`❌ ${userId} disconnected`);
  });
});

// -------------------- Start Server --------------------
const start = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log("➡️  Test endpoint: http://localhost:5000/api/ping");
    });
  } catch (err) {
    console.error("❌ Failed to start server", err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") start();

module.exports = app;
