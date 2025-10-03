const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const runValidation = require('../middleware/validate');
const gigController = require('../controllers/gigController');

router.post(
  '/',
  authMiddleware,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
  ],
  runValidation,
  gigController.createGig
);

router.get('/', authMiddleware, gigController.getGigs);
router.post('/:id/apply', authMiddleware, gigController.applyGig);

module.exports = router;

