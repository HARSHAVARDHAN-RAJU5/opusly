// src/routes/post.js
const express = require('express');
const postController = require('../controllers/postController');
const authModule = require('../middleware/auth');

const router = express.Router();

// resolve auth middleware whether file exported a function or an object
const authMiddleware = (typeof authModule === 'function')
  ? authModule
  : (authModule && authModule.authMiddleware)
  || ((req, res, next) => res.status(500).json({ success: false, message: 'Auth middleware missing' }));

// helper to ensure controller fn exists
const safe = (fn) => (req, res, next) => {
  if (!fn || typeof fn !== 'function') return next(new Error('Missing controller handler'));
  return fn(req, res, next);
};

router.post('/', authMiddleware, safe(postController.createPost));
router.get('/', authMiddleware, safe(postController.getPosts));
router.put('/:id', authMiddleware, safe(postController.updatePost));
router.delete('/:id', authMiddleware, safe(postController.deletePost));
router.post('/:id/like', authMiddleware, safe(postController.likePost));
router.post('/:id/unlike', authMiddleware, safe(postController.unlikePost));

module.exports = router;
