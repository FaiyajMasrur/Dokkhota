// Booking controller for Dokkhota session requests
// Feature 6: Session confirmation and cancellation management
const Booking = require('../models/Booking');
const SkillListing = require('../models/SkillListing');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');

// ── Valid status transitions (state machine) ───────────────────────────
// Defines which statuses can move to which other statuses.
const VALID_TRANSITIONS = {
  pending:   ['accepted', 'rejected', 'cancelled'],
  accepted:  ['cancelled', 'completed'],
  rejected:  [],          // final state
  cancelled: [],          // final state
  completed: [],          // final state
};

// ── Who is allowed to trigger each transition ──────────────────────────
// 'teacher' = only the teacher can do it
// 'student' = only the student can do it
// 'both'    = either the teacher or the student can do it
const TRANSITION_PERMISSIONS = {
  accepted:  'teacher',
  rejected:  'teacher',
  cancelled: 'both',
  completed: 'both',
};

// ── Create a new booking ───────────────────────────────────────────────
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

    // Hold the student's credits (move from available balance to held)
    student.creditBalance -= listing.creditCost;
    student.heldCredits += listing.creditCost;
    await student.save();

    // Log the hold transaction
    await CreditTransaction.create({
      userId: student._id,
      type: 'hold',
      amount: listing.creditCost,
      description: `Credits held for booking session on ${preferredDate}`,
    });

    return res.status(201).json({ success: true, booking });
  } catch (error) {
    return next(error);
  }
};

// ── List all bookings for the logged-in user ───────────────────────────
const listBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      $or: [{ teacherId: req.user.id }, { studentId: req.user.id }],
    })
      .populate('studentId', 'name email avatarUrl')
      .populate('teacherId', 'name email avatarUrl')
      .populate('listingId', 'title category creditCost')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, bookings });
  } catch (error) {
    return next(error);
  }
};

// ── Update booking status (accept / reject / cancel / complete) ────────
const updateBookingStatus = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    // ── 1. Validate the transition is allowed ──────────────────────
    const allowed = VALID_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from "${booking.status}" to "${status}"`,
      });
    }

    // ── 2. Check the user has permission for this transition ───────
    const isTeacher = booking.teacherId.toString() === req.user.id;
    const isStudent = booking.studentId.toString() === req.user.id;
    const permission = TRANSITION_PERMISSIONS[status];

    if (permission === 'teacher' && !isTeacher) {
      return res.status(403).json({ success: false, message: 'Only the teacher can perform this action' });
    }
    if (permission === 'student' && !isStudent) {
      return res.status(403).json({ success: false, message: 'Only the student can perform this action' });
    }
    if (permission === 'both' && !isTeacher && !isStudent) {
      return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
    }

    // ── 3. Handle credit logic based on the new status ─────────────
    const student = await User.findById(booking.studentId);
    const teacher = await User.findById(booking.teacherId);

    if (status === 'accepted') {
      // No credit movement needed — credits are already held from the student.
      // Just update the status.
    }

    if (status === 'rejected' || status === 'cancelled') {
      // Refund the held credits back to the student's available balance.
      if (booking.heldCredits > 0 && student) {
        student.creditBalance += booking.heldCredits;
        student.heldCredits -= booking.heldCredits;
        await student.save();

        // Log the refund
        await CreditTransaction.create({
          userId: student._id,
          type: 'refund',
          amount: booking.heldCredits,
          description: `Refund — session ${status} by ${isTeacher ? 'teacher' : 'student'}`,
        });

        booking.heldCredits = 0;
      }
    }

    if (status === 'completed') {
      // Transfer held credits from student to teacher.
      const amount = booking.heldCredits;
      if (amount > 0 && student && teacher) {
        // Remove held credits from student
        student.heldCredits -= amount;
        await student.save();

        // Add credits to teacher's available balance
        teacher.creditBalance += amount;
        await teacher.save();

        // Log spend for student
        await CreditTransaction.create({
          userId: student._id,
          type: 'spend',
          amount,
          description: `Session completed — credits paid to teacher`,
        });

        // Log earn for teacher
        await CreditTransaction.create({
          userId: teacher._id,
          type: 'earn',
          amount,
          description: `Session completed — credits earned from teaching`,
        });

        booking.heldCredits = 0;
      }
    }

    // ── 4. Save the updated booking ────────────────────────────────
    booking.status = status;
    await booking.save();

    // Re-populate so the frontend gets full names etc.
    await booking.populate('studentId', 'name email avatarUrl');
    await booking.populate('teacherId', 'name email avatarUrl');
    await booking.populate('listingId', 'title category creditCost');

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
