// Message routes for Dokkhota chat
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getConversations, getMessages, sendMessage } = require('../controllers/messageController');

router.get('/conversations', authMiddleware, getConversations);
router.get('/:partnerId', authMiddleware, getMessages);
router.post('/', authMiddleware, sendMessage);

module.exports = router;
