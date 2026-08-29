// Message routes for Dokkhota chat
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getConversations, getMessages, sendMessage, reactToMessage } = require('../controllers/messageController');

router.get('/conversations', authMiddleware, getConversations);
router.get('/:partnerId', authMiddleware, getMessages);
router.post('/', authMiddleware, sendMessage);
router.post('/:messageId/react', authMiddleware, reactToMessage);

module.exports = router;
