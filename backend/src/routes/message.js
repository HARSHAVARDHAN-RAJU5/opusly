const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.post('/', (req, res) => messageController.sendMessage(req, res));
router.get('/:chatId', (req, res) => messageController.getMessages(req, res));

module.exports = router;
