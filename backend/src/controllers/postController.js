// src/controllers/postController.js
const Post = require('../models/Post');
const User = require('../models/User');
const mongoose = require("mongoose");
const { calculatePopularity } = require('../utils/popularity');

exports.createPost = async (req, res, next) => {
  try {
    console.log("---- createPost debug ----");
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);

    const { title = '', content = '', tags } = req.body;

    if (!content || !String(content).trim()) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const tagArray =
      typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : Array.isArray(tags)
        ? tags
        : [];

    const images = (req.files || []).map((f) => `/uploads/${f.filename}`);

    
    console.log("Creating post by:", req.user);

    const post = await Post.create({
      author: new mongoose.Types.ObjectId(req.user.id),
      title: title.trim(),
      content: content.trim(),
      tags: tagArray,
      images,
    });

    if (post && post.author) {
      calculatePopularity(post.author).catch(() => {});
    }

    res.status(201).json({ success: true, post });
  } catch (err) {
    console.error(' createPost failed:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

//  get all posts
exports.getPosts = async (req, res, next) => {
  try {
    let posts = await Post.find()
      .populate('author', 'name role profilePic')
      .sort({ createdAt: -1 })
      .lean();

    const host = `${req.protocol}://${req.get('host')}`;
    const missingAuthorIds = posts
      .filter(p => !p.author || !p.author.name)
      .map(p => (p.author && p.author._id) || p.author)
      .filter(Boolean);

    let fetchedUsers = {};
    if (missingAuthorIds.length) {
      const users = await User.find({ _id: { $in: missingAuthorIds } }).select('name role profilePic').lean();
      users.forEach(u => {
        fetchedUsers[String(u._id)] = u;
      });
    }

    const fixed = posts.map(p => {
      if (!p.author || !p.author.name) {
        const aid = (p.author && (p.author._id || p.author)) || null;
        if (aid && fetchedUsers[String(aid)]) {
          p.author = fetchedUsers[String(aid)];
        } else {
          p.author = { _id: aid || null, name: 'Unknown' };
        }
      }
      p.postedBy = (p.author && (p.author.name || p.author.email)) || 'Unknown';
      if (Array.isArray(p.images)) {
        p.images = p.images.map(img => {
          if (!img) return img;
          if (img.startsWith('http://') || img.startsWith('https://')) return img;
          const cleaned = img.startsWith('/') ? img : `/${img}`;
          return `${host}${cleaned}`;
        });
      } else {
        p.images = [];
      }

      return p;
    });

    console.log("Sending posts (count):", fixed.length);
    return res.json(fixed);
  } catch (err) {
    next(err);
  }
};
//  update post
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, author: req.user.id },
      req.body,
      { new: true }
    );
    if (!post) return res.status(404).json({ message: 'Post not found or not yours' });
    res.json(post);
  } catch (err) {
    next(err);
  }
};

//  delete post
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id, author: req.user.id });
    if (!post) return res.status(404).json({ message: 'Post not found or not yours' });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};

//  like post
exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.likes.includes(req.user.id))
      return res.status(400).json({ message: 'Already liked' });

    post.likes.push(req.user.id);
    await post.save();
    await calculatePopularity(post.author);
    res.json({ message: 'Post liked', likes: post.likes.length });
  } catch (err) {
    next(err);
  }
};

//  unlike post
exports.unlikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.likes = post.likes.filter((u) => u.toString() !== req.user.id);
    await post.save();
    await calculatePopularity(post.author);
    res.json({ message: 'Post unliked', likes: post.likes.length });
  } catch (err) {
    next(err);
  }
};
