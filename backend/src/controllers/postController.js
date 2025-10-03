const Post = require('../models/Post');
const { calculatePopularity } = require('../utils/popularity');

// create post
exports.createPost = async (req, res, next) => {
  try {
    const post = await Post.create({ author: req.user.id, ...req.body });
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};

// get all posts
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

// update post (only author can update)
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

// delete post (only author can delete)
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id, author: req.user.id });
    if (!post) return res.status(404).json({ message: 'Post not found or not yours' });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};

// like post
exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.likes.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already liked' });
    }

    post.likes.push(req.user.id);
    await post.save();

    // update popularity of post author
    await calculatePopularity(post.author);

    res.json({ message: 'Post liked', likes: post.likes.length });
  } catch (err) {
    next(err);
  }
};

// unlike post
exports.unlikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.likes = post.likes.filter((u) => u.toString() !== req.user.id);
    await post.save();

    // update popularity of post author
    await calculatePopularity(post.author);

    res.json({ message: 'Post unliked', likes: post.likes.length });
  } catch (err) {
    next(err);
  }
};
