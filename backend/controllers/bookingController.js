// Booking controller for Dokkhota session requests
const Booking = require('../models/Booking');
const SkillListing = require('../models/SkillListing');
const User = require('../models/User');

const createBooking = async (req, res, next) => {
  try {
    const { listingId, preferredDate, preferredTime, message } = req.body;
    if (!listingId || !preferredDate || !preferredTime) {
      return res.status(400).json({ success: false, message: 'Listing, date, and time are required' });
    }

    const listing = await SkillListing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (student.creditBalance < listing.creditCost) {
      return res.status(400).json({ success: false, message: 'Insufficient credits for this booking' });
    }

    const booking = new Booking({
      listingId: listing._id,
      studentId: student._id,
      teacherId: listing.teacherId,
      preferredDate,
      preferredTime,
      message: message || '',
      creditCost: listing.creditCost,
      heldCredits: listing.creditCost,
    });

    await booking.save();

    student.creditBalance -= listing.creditCost;
    student.heldCredits += listing.creditCost;
    await student.save();

    return res.status(201).json({ success: true, booking });
  } catch (error) {
    return next(error);
  }
};

const listBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      $or: [{ teacherId: req.user.id }, { studentId: req.user.id }],
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, bookings });
  } catch (error) {
    return next(error);
  }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.teacherId.toString() !== req.user.id && booking.studentId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    booking.status = status;
    await booking.save();

    return res.status(200).json({ success: true, booking });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createBooking,
  listBookings,
  updateBookingStatus,
};
