const Dispute = require("../models/Dispute");
const User = require("../models/User");
const { createNotification } = require("../utils/notificationHelper");

// Create a new dispute/report
exports.createDispute = async (req, res, next) => {
  try {
    const { targetType = 'user', targetId, reportedUserId, reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reason is required",
      });
    }

    let finalReportedUserId = reportedUserId;

    // If reporting listing or review, find the associated user if not directly provided
    if (targetType === 'listing' && targetId) {
      const SkillListing = require('../models/SkillListing');
      const listing = await SkillListing.findById(targetId);
      if (listing && !finalReportedUserId) {
        finalReportedUserId = listing.teacherId;
      }
    } else if (targetType === 'review' && targetId) {
      const Review = require('../models/Review');
      const review = await Review.findById(targetId);
      if (review && !finalReportedUserId) {
        finalReportedUserId = review.reviewerId;
      }
    }

    if (finalReportedUserId && finalReportedUserId.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot report your own content",
      });
    }

    const dispute = new Dispute({
      reporter: req.user.id,
      targetType: targetType || 'user',
      targetId: targetId || null,
      reportedUser: finalReportedUserId || null,
      reason: reason.trim(),
      status: "Pending",
    });

    await dispute.save();

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully. Our team will review it shortly.",
      dispute,
    });
  } catch (error) {
    return next(error);
  }
};
