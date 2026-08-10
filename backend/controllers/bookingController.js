// Booking controller for Dokkhota session requests
// Feature 6: Session confirmation and cancellation management
// Features 13 & 14: Notification system and Session history log integration
const Booking = require("../models/Booking");
const SkillListing = require("../models/SkillListing");
const User = require("../models/User");
const CreditTransaction = require("../models/CreditTransaction");
const Session = require("../models/Session");
const { createNotification } = require("../utils/notificationHelper");

// ── Valid status transitions (state machine) ───────────────────────────
const VALID_TRANSITIONS = {
  pending: ["accepted", "rejected", "cancelled"],
  accepted: ["cancelled", "completed"],
  rejected: [],
  cancelled: [],
  completed: [],
};

// ── Who is allowed to trigger each transition ──────────────────────────
const TRANSITION_PERMISSIONS = {
  accepted: "teacher",
  rejected: "teacher",
  cancelled: "both",
  completed: "both",
};

// ── Create a new booking ───────────────────────────────────────────────
const createBooking = async (req, res, next) => {
  try {
    const { listingId, preferredDate, preferredTime, message } = req.body;
    if (!listingId || !preferredDate || !preferredTime) {
      return res
        .status(400)
        .json({ success: false, message: "Listing, date, and time are required" });
    }

    const listing = await SkillListing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (student.creditBalance < listing.creditCost) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient credits for this booking" });
    }

    const booking = new Booking({
      listingId: listing._id,
      studentId: student._id,
      teacherId: listing.teacherId,
      preferredDate,
      preferredTime,
      message: message || "",
      creditCost: listing.creditCost,
      heldCredits: listing.creditCost,
    });

    await booking.save();

    // Hold student's credits
    student.creditBalance -= listing.creditCost;
    student.heldCredits += listing.creditCost;
    await student.save();

    // Log the hold transaction
    await CreditTransaction.create({
      userId: student._id,
      type: "hold",
      amount: listing.creditCost,
      sessionId: booking._id,
      description: `Credits held for session "${listing.title}" on ${preferredDate}`,
    });

    // Send notification to teacher
    const io = req.app.get("io");
    await createNotification({
      userId: listing.teacherId,
      title: "New Booking Request",
      message: `${student.name} requested to book "${listing.title}" for ${preferredDate} at ${preferredTime}`,
      type: "booking",
      io,
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
      .populate("studentId", "name email avatarUrl")
      .populate("teacherId", "name email avatarUrl")
      .populate("listingId", "title category creditCost")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, bookings });
  } catch (error) {
    return next(error);
  }
};

// ── Update booking status (accept / reject / cancel / complete) ────────
const updateBookingStatus = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate("listingId");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const allowed = VALID_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from "${booking.status}" to "${status}"`,
      });
    }

    const isTeacher = booking.teacherId.toString() === req.user.id;
    const isStudent = booking.studentId.toString() === req.user.id;
    const permission = TRANSITION_PERMISSIONS[status];

    if (permission === "teacher" && !isTeacher) {
      return res
        .status(403)
        .json({ success: false, message: "Only the teacher can perform this action" });
    }
    if (permission === "student" && !isStudent) {
      return res
        .status(403)
        .json({ success: false, message: "Only the student can perform this action" });
    }
    if (permission === "both" && !isTeacher && !isStudent) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized for this booking" });
    }

    const student = await User.findById(booking.studentId);
    const teacher = await User.findById(booking.teacherId);
    const io = req.app.get("io");
    const skillTitle = booking.listingId?.title || "Session";

    if (status === "accepted") {
      await createNotification({
        userId: booking.studentId,
        title: "Booking Accepted",
        message: `Your booking request for "${skillTitle}" was accepted by ${teacher.name}!`,
        type: "booking",
        io,
      });
    }

    if (status === "rejected" || status === "cancelled") {
      if (booking.heldCredits > 0 && student) {
        student.creditBalance += booking.heldCredits;
        student.heldCredits -= booking.heldCredits;
        await student.save();

        await CreditTransaction.create({
          userId: student._id,
          type: "refund",
          amount: booking.heldCredits,
          sessionId: booking._id,
          description: `Refund — session "${skillTitle}" ${status} by ${isTeacher ? "teacher" : "student"}`,
        });

        booking.heldCredits = 0;
      }

      // Notify the other party
      const notifyUserId = isTeacher ? booking.studentId : booking.teacherId;
      const notifyUserRole = isTeacher ? "Teacher" : "Student";
      await createNotification({
        userId: notifyUserId,
        title: `Booking ${status === "rejected" ? "Declined" : "Cancelled"}`,
        message: `Booking for "${skillTitle}" was ${status} by ${notifyUserRole}.`,
        type: "booking",
        io,
      });
    }

    if (status === "completed") {
      const amount = booking.heldCredits;
      if (amount > 0 && student && teacher) {
        student.heldCredits -= amount;
        await student.save();

        teacher.creditBalance += amount;
        await teacher.save();

        await CreditTransaction.create({
          userId: student._id,
          type: "spend",
          amount,
          sessionId: booking._id,
          description: `Session completed — ${amount} credits paid for "${skillTitle}"`,
        });

        await CreditTransaction.create({
          userId: teacher._id,
          type: "earn",
          amount,
          sessionId: booking._id,
          description: `Session completed — ${amount} credits earned teaching "${skillTitle}"`,
        });

        booking.heldCredits = 0;
      }

      // Sync Session document for session history compatibility
      try {
        await Session.create({
          teacherId: booking.teacherId,
          learnerId: booking.studentId,
          skill: skillTitle,
          sessionDate: new Date(booking.preferredDate || Date.now()),
          status: "Completed",
        });
      } catch (e) {
        console.warn("Session sync warning:", e.message);
      }

      // Notify both parties
      await createNotification({
        userId: booking.studentId,
        title: "Session Completed",
        message: `Session "${skillTitle}" marked completed. ${amount} credits transferred to teacher.`,
        type: "booking",
        io,
      });

      await createNotification({
        userId: booking.teacherId,
        title: "Session Completed",
        message: `Session "${skillTitle}" marked completed. You earned ${amount} credits!`,
        type: "credit",
        io,
      });
    }

    booking.status = status;
    await booking.save();

    await booking.populate("studentId", "name email avatarUrl");
    await booking.populate("teacherId", "name email avatarUrl");
    await booking.populate("listingId", "title category creditCost");

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