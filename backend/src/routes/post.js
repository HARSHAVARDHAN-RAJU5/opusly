const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const runValidation = require('../middleware/validate');
const postController = require('../controllers/postController');

router.post(
  '/',
  authMiddleware,
  [body('content').notEmpty().withMessage('Content is required')],
  runValidation,
  postController.createPost
);

router.get('/', authMiddleware, postController.getPosts);
router.put('/:id', authMiddleware, postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);

// like/unlike routes
router.post('/:id/like', authMiddleware, postController.likePost);
router.post('/:id/unlike', authMiddleware, postController.unlikePost);

module.exports = router;
