// Badge routes for Dokkhota skill verification badge system
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  uploadProof,
  submitBadgeRequest,
  getMyBadges,
  getUserBadges,
  getPendingBadges,
  getAllBadges,
  reviewBadge,
} = require('../controllers/badgeController');

// User routes
router.post('/', authMiddleware, uploadProof, submitBadgeRequest);
router.get('/my', authMiddleware, getMyBadges);
router.get('/user/:userId', getUserBadges);

// Admin routes
router.get('/pending', authMiddleware, getPendingBadges);
router.get('/all', authMiddleware, getAllBadges);
router.patch('/:badgeId', authMiddleware, reviewBadge);

module.exports = router;
