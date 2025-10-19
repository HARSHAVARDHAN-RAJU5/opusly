// src/routes/post.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const postController = require("../controllers/postController");
const authModule = require("../middleware/auth");

const router = express.Router();

// ---------------- Auth Middleware Resolve ----------------
const authMiddleware =
  typeof authModule === "function"
    ? authModule
    : (authModule && authModule.authMiddleware) ||
      ((req, res, next) =>
        res
          .status(500)
          .json({ success: false, message: "Auth middleware missing" }));

// ---------------- Multer Setup ----------------
// IMPORTANT: point to backend-root/uploads/posts (one level up from src)
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "posts");

// ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
});

// ---------------- Debug Logs Middleware ----------------
const debugUploads = (req, res, next) => {
  console.log("💾 --- POST /api/posts received ---");
  console.log("req.files =", req.files);
  console.log("req.body =", req.body);
  next();
};

// ---------------- Routes ----------------

// 🩷 Create Post (handles text + up to 6 images)
router.post(
  "/",
  authMiddleware,
  upload.array("images", 6),
  debugUploads,
  postController.createPost
);

// 🩷 Get all posts
router.get("/", authMiddleware, postController.getPosts);

// 🩷 Update a post
router.put("/:id", authMiddleware, postController.updatePost);

// 🩷 Delete a post
router.delete("/:id", authMiddleware, postController.deletePost);

// 🩷 Like & Unlike
router.post("/:id/like", authMiddleware, postController.likePost);
router.post("/:id/unlike", authMiddleware, postController.unlikePost);

module.exports = router;
