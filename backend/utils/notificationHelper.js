const Notification = require("../models/Notification");

/**
 * Creates a notification in DB and optionally emits it via Socket.IO
 */
const createNotification = async ({ userId, title, message, type = "booking", io = null }) => {
  try {
    if (!userId || !title || !message) return null;

    const notification = new Notification({
      userId,
      title,
      message,
      type,
      isRead: false,
    });

    await notification.save();

    if (io) {
      io.to(userId.toString()).emit("new_notification", notification);
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error.message);
    return null;
  }
};

module.exports = {
  createNotification,
};
