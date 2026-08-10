// Review controller for Dokkhota rating & review system (Feature 9)
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const SkillListing = require('../models/SkillListing');
const User = require('../models/User');

// ── Submit a review for a completed session ─────────────────────────
const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const reviewerId = req.user.id;

    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, message: 'Booking ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // 1. Verify the booking exists and is completed
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed sessions' });
    }

    // 2. Verify the reviewer is part of this booking
    const isTeacher = booking.teacherId.toString() === reviewerId;
    const isStudent = booking.studentId.toString() === reviewerId;
    if (!isTeacher && !isStudent) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this session' });
    }

    // 3. Determine who is being reviewed (the other person)
    const revieweeId = isStudent ? booking.teacherId : booking.studentId;

    // 4. Check for duplicate review
    const existing = await Review.findOne({ bookingId, reviewerId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this session' });
    }

    // 5. Save the review
    const review = new Review({
      bookingId,
      listingId: booking.listingId,
      reviewerId,
      revieweeId,
      rating,
      comment: comment || '',
    });

    await review.save();

    // 6. Update listing average rating
    const listingReviews = await Review.find({ listingId: booking.listingId });
    const avg = listingReviews.reduce((sum, r) => sum + r.rating, 0) / listingReviews.length;
    await SkillListing.findByIdAndUpdate(booking.listingId, {
      averageRating: Math.round(avg * 10) / 10,
      totalSessions: listingReviews.length,
    });

    await review.populate('reviewerId', 'name avatarUrl');

    return res.status(201).json({ success: true, review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this session' });
    }
    return next(error);
  }
};

// ── Get reviews for a specific listing ──────────────────────────────
const getListingReviews = async (req, res, next) => {
  try {
    const { listingId } = req.params;

    const reviews = await Review.find({ listingId })
      .populate('reviewerId', 'name avatarUrl')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, reviews });
  } catch (error) {
    return next(error);
  }
};

// ── Get reviews for a specific user (as reviewee) ────────────────────
const getUserReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ revieweeId: userId })
      .populate('reviewerId', 'name avatarUrl')
      .populate('listingId', 'title category')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

    return res.status(200).json({ success: true, reviews, averageRating, totalReviews });
  } catch (error) {
    return next(error);
  }
};

// ── Check if current user already reviewed a booking ─────────────────
const checkReview = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const reviewerId = req.user.id;

    const existing = await Review.findOne({ bookingId, reviewerId });
    return res.status(200).json({ success: true, hasReviewed: !!existing, review: existing });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createReview,
  getListingReviews,
  getUserReviews,
  checkReview,
};