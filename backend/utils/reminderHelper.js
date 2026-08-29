const Booking = require('../models/Booking');
const { createNotification } = require('./notificationHelper');
const { sendEmail } = require('../config/email');

/**
 * Checks for upcoming confirmed bookings to send 24h email reminders and 30m in-app notifications
 */
const checkUpcomingSessionReminders = async (io = null) => {
  try {
    const activeBookings = await Booking.find({
      status: 'accepted',
      $or: [{ reminderSent24h: { $ne: true } }, { reminderSent30m: { $ne: true } }],
    })
      .populate('studentId', 'name email')
      .populate('teacherId', 'name email')
      .populate('listingId', 'title');

    const now = Date.now();

    for (const booking of activeBookings) {
      if (!booking.preferredDate) continue;

      const sessionDateTime = new Date(`${booking.preferredDate} ${booking.preferredTime || '00:00'}`);
      const sessionTime = sessionDateTime.getTime();
      if (isNaN(sessionTime) || sessionTime < now) continue;

      const diffHours = (sessionTime - now) / (1000 * 60 * 60);
      const diffMinutes = (sessionTime - now) / (1000 * 60);
      const skillTitle = booking.listingId?.title || 'Session';

      // ── 1. 24-Hour Email Reminder ─────────────────────────────────────
      if (!booking.reminderSent24h && diffHours <= 24 && diffHours > 0) {
        const student = booking.studentId;
        const teacher = booking.teacherId;

        const emailHtml = `
          <h2>Upcoming Session Reminder ⏰</h2>
          <p>This is a reminder that your session for <strong>${skillTitle}</strong> is scheduled in ~${Math.round(diffHours)} hours.</p>
          <p><strong>Date:</strong> ${booking.preferredDate}</p>
          <p><strong>Time:</strong> ${booking.preferredTime}</p>
          <p>Please be ready to join via Dokkhota video call.</p>
        `;

        if (student?.email) {
          sendEmail(student.email, `Upcoming Session Reminder: ${skillTitle}`, emailHtml).catch(() => {});
        }
        if (teacher?.email) {
          sendEmail(teacher.email, `Upcoming Teaching Session Reminder: ${skillTitle}`, emailHtml).catch(() => {});
        }

        booking.reminderSent24h = true;
        await booking.save();
      }

      // ── 2. 30-Minute In-App Real-Time Alert ───────────────────────────
      if (!booking.reminderSent30m && diffMinutes <= 30 && diffMinutes > 0) {
        if (booking.studentId) {
          await createNotification({
            userId: booking.studentId._id,
            title: 'Session Starting Soon ⏰',
            message: `Your session "${skillTitle}" starts in ~${Math.round(diffMinutes)} minutes. Get ready to join!`,
            type: 'call',
            link: `/session/${booking._id}`,
            bookingId: booking._id,
            io,
          });
        }

        if (booking.teacherId) {
          await createNotification({
            userId: booking.teacherId._id,
            title: 'Teaching Session Starting Soon ⏰',
            message: `Your session for "${skillTitle}" starts in ~${Math.round(diffMinutes)} minutes.`,
            type: 'call',
            link: `/session/${booking._id}`,
            bookingId: booking._id,
            io,
          });
        }

        booking.reminderSent30m = true;
        await booking.save();
      }
    }
  } catch (err) {
    console.error('Session reminder check warning:', err.message);
  }
};

/**
 * Initializes a background reminder timer running every 2 minutes
 */
const initReminderScheduler = (io) => {
  // Run initial check
  checkUpcomingSessionReminders(io);
  // Schedule every 2 minutes
  setInterval(() => {
    checkUpcomingSessionReminders(io);
  }, 2 * 60 * 1000);
};

module.exports = {
  checkUpcomingSessionReminders,
  initReminderScheduler,
};
