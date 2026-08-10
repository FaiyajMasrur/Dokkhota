const Booking = require("../models/Booking");
const Session = require("../models/Session");

// Get session history log for the logged-in user (as teacher or learner)
exports.getSessionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all bookings for the user
    const bookings = await Booking.find({
      $or: [{ teacherId: userId }, { studentId: userId }],
    })
      .populate("studentId", "name email avatarUrl")
      .populate("teacherId", "name email avatarUrl")
      .populate("listingId", "title category creditCost")
      .sort({ createdAt: -1 });

    // Format bookings into clean session history entries
    const sessions = bookings.map((b) => {
      const isTeacher = b.teacherId?._id?.toString() === userId || b.teacherId?.toString() === userId;
      return {
        _id: b._id,
        bookingId: b._id,
        role: isTeacher ? "Teacher" : "Learner",
        teacherId: b.teacherId,
        learnerId: b.studentId,
        skill: b.listingId?.title || "Skill Exchange",
        category: b.listingId?.category || "General",
        sessionDate: b.preferredDate,
        sessionTime: b.preferredTime,
        status: b.status,
        creditCost: b.creditCost,
        partner: isTeacher ? b.studentId : b.teacherId,
        createdAt: b.createdAt,
      };
    });

    res.json({
      success: true,
      sessions,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};