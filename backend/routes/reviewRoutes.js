// Review routes for Dokkhota rating & review system
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createReview, getListingReviews, getUserReviews, checkReview } = require('../controllers/reviewController');

router.post('/', authMiddleware, createReview);
router.get('/listing/:listingId', getListingReviews);
router.get('/user/:userId', getUserReviews);
router.get('/check/:bookingId', authMiddleware, checkReview);

module.exports = router;
