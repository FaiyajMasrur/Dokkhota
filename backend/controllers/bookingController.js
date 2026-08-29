const Booking = require("../models/Booking");
const SkillListing = require("../models/SkillListing");
const User = require("../models/User");
const SkillBadge = require("../models/SkillBadge");
const CreditTransaction = require("../models/CreditTransaction");
const Session = require("../models/Session");
const { createNotification } = require("../utils/notificationHelper");
const { sendEmail } = require("../config/email");

// ── Cancellation window in hours ───────────────────────────────────────
const CANCELLATION_WINDOW_HOURS = Number(process.env.CANCELLATION_WINDOW_HOURS || 2);

// ── Valid status transitions (state machine) ───────────────────────────
const VALID_TRANSITIONS = {
  pending: ["accepted", "rejected", "cancelled"],
  accepted: ["cancelled", "completed", "no-show"],
  rejected: [],
  cancelled: [],
  completed: [],
  "no-show": [],
};

// ── Who is allowed to trigger each transition ──────────────────────────
const TRANSITION_PERMISSIONS = {
  accepted: "teacher",
  rejected: "teacher",
  cancelled: "both",
  completed: "both",
  "no-show": "both",
};

// ── Helper to calculate hours until session ────────────────────────────
const getHoursUntilSession = (dateStr, timeStr) => {
  try {
    const sessionDateTime = new Date(`${dateStr} ${timeStr || "00:00"}`);
    if (isNaN(sessionDateTime.getTime())) return 999;
    return (sessionDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  } catch (e) {
    return 999;
  }
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
      link: "/dashboard",
      bookingId: booking._id,
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

// ── Update booking status (accept / reject / cancel / complete / no-show) ──
const updateBookingStatus = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate("listingId");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const { status, cancellationReason } = req.body;
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

    if (cancellationReason) {
      booking.cancellationReason = cancellationReason;
      booking.cancelledBy = req.user.id;
    }

    // ── 1. ACCEPTED: Confirm session and send confirmation email ─────
    if (status === "accepted") {
      await createNotification({
        userId: booking.studentId,
        title: "Booking Accepted",
        message: `Your booking request for "${skillTitle}" on ${booking.preferredDate} at ${booking.preferredTime} was accepted by ${teacher?.name || "Teacher"}!`,
        type: "booking",
        link: `/session/${booking._id}`,
        bookingId: booking._id,
        io,
      });

      // Send email confirmation
      try {
        if (student?.email) {
          const emailHtml = `
            <h2>Booking Confirmed! 🎉</h2>
            <p>Hi ${student.name},</p>
            <p>Your session for <strong>${skillTitle}</strong> has been confirmed by <strong>${teacher?.name || "Provider"}</strong>.</p>
            <p><strong>Date:</strong> ${booking.preferredDate}</p>
            <p><strong>Time:</strong> ${booking.preferredTime}</p>
            <p><strong>Credits Held:</strong> ${booking.creditCost} SC</p>
            <p>You can join the video/audio call from your Dokkhota dashboard when it's time.</p>
          `;
          sendEmail(student.email, `Session Confirmed: ${skillTitle}`, emailHtml).catch(() => {});
        }
      } catch (e) {
        console.warn("Email confirmation send error:", e.message);
      }
    }

    // ── 2. REJECTED: Full refund to student ─────────────────────────
    if (status === "rejected") {
      if (booking.heldCredits > 0 && student) {
        student.creditBalance += booking.heldCredits;
        student.heldCredits -= booking.heldCredits;
        await student.save();

        await CreditTransaction.create({
          userId: student._id,
          type: "refund",
          amount: booking.heldCredits,
          sessionId: booking._id,
          description: `Full refund — session "${skillTitle}" declined by teacher`,
        });

        booking.heldCredits = 0;
      }

      await createNotification({
        userId: booking.studentId,
        title: "Booking Declined",
        message: `Your booking request for "${skillTitle}" was declined by ${teacher?.name || "Teacher"}. Credits have been refunded.`,
        type: "booking",
        link: "/dashboard",
        io,
      });
    }

    // ── 3. CANCELLED: Check cancellation window & apply penalty ─────
    if (status === "cancelled") {
      const held = booking.heldCredits;
      if (held > 0 && student && teacher) {
        const hoursUntil = getHoursUntilSession(booking.preferredDate, booking.preferredTime);
        const isLateCancelByStudent = isStudent && hoursUntil < CANCELLATION_WINDOW_HOURS;

        if (isLateCancelByStudent) {
          // Late cancellation penalty: 50% penalty paid to teacher
          const penalty = Math.ceil(held * 0.5);
          const refundAmount = held - penalty;

          student.creditBalance += refundAmount;
          student.heldCredits -= held;
          await student.save();

          teacher.creditBalance += penalty;
          await teacher.save();

          booking.penaltyAmount = penalty;

          if (refundAmount > 0) {
            await CreditTransaction.create({
              userId: student._id,
              type: "refund",
              amount: refundAmount,
              sessionId: booking._id,
              description: `Partial refund (${refundAmount} SC) — late cancellation of "${skillTitle}" (${penalty} SC penalty applied)`,
            });
          }

          await CreditTransaction.create({
            userId: student._id,
            type: "penalty",
            amount: penalty,
            sessionId: booking._id,
            description: `Cancellation penalty (${penalty} SC) for cancelling session "${skillTitle}" less than ${CANCELLATION_WINDOW_HOURS}h prior`,
          });

          await CreditTransaction.create({
            userId: teacher._id,
            type: "earn",
            amount: penalty,
            sessionId: booking._id,
            description: `Compensation (${penalty} SC) for late cancellation of session "${skillTitle}" by learner`,
          });
        } else {
          // Normal cancellation (by teacher or by student > window): 100% full refund
          student.creditBalance += held;
          student.heldCredits -= held;
          await student.save();

          await CreditTransaction.create({
            userId: student._id,
            type: "refund",
            amount: held,
            sessionId: booking._id,
            description: `Full refund (${held} SC) — session "${skillTitle}" cancelled by ${isTeacher ? "teacher" : "learner"}`,
          });
        }

        booking.heldCredits = 0;
      }

      // Notify the other party
      const notifyUserId = isTeacher ? booking.studentId : booking.teacherId;
      const notifyUserRole = isTeacher ? "Teacher" : "Student";
      await createNotification({
        userId: notifyUserId,
        title: "Session Cancelled",
        message: `Session "${skillTitle}" was cancelled by ${notifyUserRole}.${booking.cancellationReason ? ` Reason: ${booking.cancellationReason}` : ""}`,
        type: "booking",
        link: "/dashboard",
        io,
      });
    }

    // ── 4. NO-SHOW: Handle no-show situations ───────────────────────
    if (status === "no-show") {
      const held = booking.heldCredits;
      if (held > 0 && student && teacher) {
        if (isStudent) {
          // Learner reported teacher no-show: 100% refund to learner
          student.creditBalance += held;
          student.heldCredits -= held;
          await student.save();

          await CreditTransaction.create({
            userId: student._id,
            type: "refund",
            amount: held,
            sessionId: booking._id,
            description: `Full refund (${held} SC) — session "${skillTitle}" marked as Provider No-Show`,
          });

          await createNotification({
            userId: booking.teacherId,
            title: "Session Marked as No-Show",
            message: `Learner marked session "${skillTitle}" as a provider no-show. Credits refunded to learner.`,
            type: "booking",
            link: "/dashboard",
            io,
          });
        } else {
          // Teacher reported learner no-show: transfer credits to teacher as session slot was held
          student.heldCredits -= held;
          await student.save();

          teacher.creditBalance += held;
          await teacher.save();

          await CreditTransaction.create({
            userId: student._id,
            type: "penalty",
            amount: held,
            sessionId: booking._id,
            description: `Credits forfeited (${held} SC) — no-show for scheduled session "${skillTitle}"`,
          });

          await CreditTransaction.create({
            userId: teacher._id,
            type: "earn",
            amount: held,
            sessionId: booking._id,
            description: `Session credits awarded (${held} SC) — learner no-show for "${skillTitle}"`,
          });

          await createNotification({
            userId: booking.studentId,
            title: "Session Marked as No-Show",
            message: `Provider marked session "${skillTitle}" as learner no-show.`,
            type: "booking",
            link: "/dashboard",
            io,
          });
        }

        booking.heldCredits = 0;
      }
    }

    // ── 5. COMPLETED: Transfer credits and sync session log ─────────
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

        // ── 5.1 Calculate & Update Teacher Teaching Streak (FR-29) ───
        const now = new Date();
        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
        
        if (!teacher.lastSessionWeek) {
          teacher.streakCount = 1;
          teacher.lastSessionWeek = now;
        } else {
          const d1 = new Date(teacher.lastSessionWeek);
          const d2 = new Date(now);
          const day1 = d1.getDay() || 7;
          d1.setDate(d1.getDate() - day1 + 1);
          d1.setHours(0, 0, 0, 0);

          const day2 = d2.getDay() || 7;
          d2.setDate(d2.getDate() - day2 + 1);
          d2.setHours(0, 0, 0, 0);

          const diffWeeks = Math.round(Math.abs(d2 - d1) / ONE_WEEK_MS);
          if (diffWeeks === 0) {
            teacher.streakCount = Math.max(teacher.streakCount || 0, 1);
            teacher.lastSessionWeek = now;
          } else if (diffWeeks === 1) {
            teacher.streakCount = (teacher.streakCount || 0) + 1;
            teacher.lastSessionWeek = now;
          } else {
            teacher.streakCount = 1;
            teacher.lastSessionWeek = now;
          }
        }

        await teacher.save();

        // ── 5.2 Milestone Badges (3, 5, 10 weeks) ───────────────────
        const streak = teacher.streakCount;
        const milestones = [
          { count: 3, name: "Bronze Mentor (3-Week Streak)", desc: "Maintained a 3-week consecutive teaching streak." },
          { count: 5, name: "Silver Mentor (5-Week Streak)", desc: "Maintained a 5-week consecutive teaching streak." },
          { count: 10, name: "Gold Mentor (10-Week Streak)", desc: "Master Educator with a 10-week consecutive teaching streak." },
        ];

        for (const m of milestones) {
          if (streak >= m.count) {
            const existingBadge = await SkillBadge.findOne({
              userId: teacher._id,
              skillName: m.name,
              status: "approved",
            });

            if (!existingBadge) {
              await SkillBadge.create({
                userId: teacher._id,
                skillName: m.name,
                description: m.desc,
                proofType: "experience",
                status: "approved",
                adminNote: "Automated Milestone Badge for Teaching Streak",
              });

              await createNotification({
                userId: teacher._id,
                title: "🏆 Streak Milestone Unlocked!",
                message: `Congratulations! You unlocked the "${m.name}" badge for your active teaching streak!`,
                type: "badge",
                link: `/profile/${teacher._id}`,
                io,
              });
            }
          }
        }

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
        message: `Session "${skillTitle}" marked completed. Please leave a review!`,
        type: "booking",
        link: "/dashboard",
        bookingId: booking._id,
        io,
      });

      await createNotification({
        userId: booking.teacherId,
        title: "Session Completed",
        message: `Session "${skillTitle}" marked completed. You earned ${amount} credits!`,
        type: "credit",
        link: "/dashboard",
        bookingId: booking._id,
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