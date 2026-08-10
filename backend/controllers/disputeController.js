const Dispute = require("../models/Dispute");
const User = require("../models/User");
const { createNotification } = require("../utils/notificationHelper");

// Create a new dispute/report
exports.createDispute = async (req, res, next) => {
  try {
    const { reportedUserId, reason } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({
        success: false,
        message: "Reported user ID and reason are required",
      });
    }

    if (reportedUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot report yourself",
      });
    }

    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        message: "Reported user not found",
      });
    }

    const dispute = new Dispute({
      reporter: req.user.id,
      reportedUser: reportedUserId,
      reason: reason.trim(),
      status: "Pending",
    });

    await dispute.save();

    return res.status(201).json({
      success: true,
      message: "Dispute reported successfully",
      dispute,
    });
  } catch (error) {
    return next(error);
  }
};
