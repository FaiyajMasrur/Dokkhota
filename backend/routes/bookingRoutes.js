// Booking routes for Dokkhota
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createBooking, listBookings, updateBookingStatus } = require('../controllers/bookingController');

router.post('/', authMiddleware, createBooking);
router.get('/', authMiddleware, listBookings);
router.patch('/:bookingId', authMiddleware, updateBookingStatus);

module.exports = router;
