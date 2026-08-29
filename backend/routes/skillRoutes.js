// Skill listing routes for Dokkhota
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createListing,
  updateListing,
  toggleListing,
  deleteListing,
  getMyListings,
  getListingById,
  searchListings,
  getRecommendedListings,
} = require('../controllers/skillController');

router.post('/', authMiddleware, createListing);
router.patch('/:listingId', authMiddleware, updateListing);
router.patch('/:listingId/toggle', authMiddleware, toggleListing);
router.delete('/:listingId', authMiddleware, deleteListing);
router.get('/my', authMiddleware, getMyListings);
router.get('/recommended', authMiddleware, getRecommendedListings);
router.get('/search', searchListings);
router.get('/:listingId', getListingById);

module.exports = router;
