const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const messageController = require('../controllers/messageController');

// fetch conversation with a user
router.get('/:withUser', authMiddleware, messageController.getMessages);

module.exports = router;

