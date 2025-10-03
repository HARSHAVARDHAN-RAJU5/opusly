const express = require('express');
const {
  createPost,
  getPosts,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
} = require('../controllers/postController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// create post
router.post('/', authMiddleware, createPost);

// get all posts
router.get('/', authMiddleware, getPosts);

// update post
router.put('/:id', authMiddleware, updatePost);

// delete post
router.delete('/:id', authMiddleware, deletePost);

// like post
router.post('/:id/like', authMiddleware, likePost);

// unlike post
router.post('/:id/unlike', authMiddleware, unlikePost);

module.exports = router;
