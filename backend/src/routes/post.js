// src/routes/post.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const postController = require("../controllers/postController");
const authModule = require("../middleware/auth");

const router = express.Router();


const authMiddleware =
  typeof authModule === "function"
    ? authModule
    : (authModule && authModule.authMiddleware) ||
      ((req, res, next) =>
        res
          .status(500)
          .json({ success: false, message: "Auth middleware missing" }));

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

const debugUploads = (req, res, next) => {
  console.log(" --- POST /api/posts received ---");
  console.log("req.files =", req.files);
  console.log("req.body =", req.body);
  next();
};

router.post(
  "/",
  authMiddleware,
  upload.array("images", 6),
  debugUploads,
  postController.createPost
);

router.get("/", authMiddleware, postController.getPosts);
router.put("/:id", authMiddleware, postController.updatePost);
router.delete("/:id", authMiddleware, postController.deletePost);
router.post("/:id/like", authMiddleware, postController.likePost);
router.post("/:id/unlike", authMiddleware, postController.unlikePost);

module.exports = router;
