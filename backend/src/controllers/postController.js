// src/controllers/postController.js

const Post = require("../models/Post");
const User = require("../models/User");
const mongoose = require("mongoose");
const { calculatePopularity } = require("../utils/popularity");

exports.createPost = async (req, res) => {
  try {
    const { title = "", content = "", tags } = req.body;

    if (!content || !String(content).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Title and content are required" });
    }

    const tagArray =
      typeof tags === "string"
        ? tags.split(",").map((t) => t.trim()).filter(Boolean)
        : Array.isArray(tags)
        ? tags
        : [];

    const images = (req.files || []).map((f) => `/uploads/${f.filename}`);

    const post = await Post.create({
      author: new mongoose.Types.ObjectId(req.user.id),
      title: title.trim(),
      content: content.trim(),
      tags: tagArray,
      images,
    });

    // update popularity
    if (post && post.author) {
      calculatePopularity(post.author).catch(() => {});
    }

    return res.status(201).json({ success: true, post });
  } catch (err) {
    console.error("createPost error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPosts = async (req, res, next) => {
  try {
    let posts = await Post.find()
      .populate("author", "name role profilePic")
      .sort({ createdAt: -1 })
      .lean();

    const host = `${req.protocol}://${req.get("host")}`;

    const fixed = posts.map((p) => {
      // fix missing author
      if (!p.author || !p.author.name) {
        p.author = { _id: p.author?._id || null, name: "Unknown" };
      }

      p.postedBy = p.author.name || "Unknown";

      // fix image URLs
      if (Array.isArray(p.images)) {
        p.images = p.images.map((img) => {
          if (!img) return img;
          if (img.startsWith("http")) return img;
          const cleaned = img.startsWith("/") ? img : `/${img}`;
          return `${host}${cleaned}`;
        });
      } else {
        p.images = [];
      }

      return p;
    });

    return res.json(fixed);
  } catch (err) {
    next(err);
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, author: req.user.id },
      req.body,
      { new: true }
    );
    if (!post)
      return res
        .status(404)
        .json({ message: "Post not found or not yours" });

    return res.json(post);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      author: req.user.id,
    });
    if (!post)
      return res
        .status(404)
        .json({ message: "Post not found or not yours" });

    return res.json({ message: "Post deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user.id;

    if (!post)
      return res.status(404).json({ message: "Post not found" });

    if (!Array.isArray(post.likes)) post.likes = [];

    if (post.likes.includes(userId)) {
      return res.status(400).json({ message: "Already liked" });
    }

    // prevent liking own post
    if (post.author.toString() === userId) {
      return res
        .status(400)
        .json({ message: "You cannot like your own post" });
    }

    post.likes.push(userId);
    await post.save();

    // update popularity of the post author
    await calculatePopularity(post.author);

    return res.json({
      message: "Post liked",
      likes: post.likes.length,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user.id;

    if (!post)
      return res.status(404).json({ message: "Post not found" });

    post.likes = post.likes.filter(
      (u) => u.toString() !== userId
    );

    await post.save();

    // update popularity
    await calculatePopularity(post.author);

    return res.json({
      message: "Post unliked",
      likes: post.likes.length,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
