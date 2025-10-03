const express = require('express');
const { getMessages } = require('../controllers/messageController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// get conversation with specific user
router.get('/:withUser', authMiddleware, getMessages);

module.exports = router;
