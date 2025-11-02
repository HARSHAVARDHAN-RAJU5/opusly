// src/controllers/postController.js
const Post = require('../models/Post');
const { calculatePopularity } = require('../utils/popularity');

//  create post (final fixed)
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

    const images = (req.files || []).map((f) => `/uploads/posts/${f.filename}`);

    const post = await Post.create({
      author: req.user.id,
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
    const posts = await Post.find()
      .populate('author', 'name role profilePic')
      .sort({ createdAt: -1 });
    res.json(posts);
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
