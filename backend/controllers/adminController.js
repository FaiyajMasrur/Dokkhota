const User = require("../models/User");
const Booking = require("../models/Booking");
const Dispute = require("../models/Dispute");
const SkillListing = require("../models/SkillListing");
const Review = require("../models/Review");
const CreditTransaction = require("../models/CreditTransaction");
const { createNotification } = require("../utils/notificationHelper");

exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const activeListings = await SkillListing.countDocuments({ isActive: true });
    const totalDisputes = await Dispute.countDocuments({ status: "Pending" });

    // Calculate dates for this week and this month
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const sessionsThisWeek = await Booking.countDocuments({
      status: "completed",
      updatedAt: { $gte: startOfWeek },
    });

    const sessionsThisMonth = await Booking.countDocuments({
      status: "completed",
      updatedAt: { $gte: startOfMonth },
    });

    const totalCredits = await CreditTransaction.aggregate([
      {
        $group: {
          _id: null,
          credits: { $sum: "$amount" },
        },
      },
    ]);

    const topFlags = await Dispute.find({ status: "Pending" })
      .populate("reporter", "name email")
      .populate("reportedUser", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      totalUsers,
      totalBookings,
      activeListings,
      sessionsThisWeek,
      sessionsThisMonth,
      totalDisputes,
      totalCredits: totalCredits[0]?.credits || 0,
      topFlags,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
    res.json({
      success: true,
      users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── Suspend User with mandatory reason ─────────────────────────────────
exports.suspendUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isSuspended: true,
        suspensionReason: reason || "Suspended by administrator for policy violation",
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User account suspended",
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── Unsuspend / Activate User ──────────────────────────────────────────
exports.unsuspendUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isSuspended: false,
        suspensionReason: "",
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User account activated",
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── Delete User ────────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: "User account permanently deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── Get All Reported Disputes / Flags ──────────────────────────────────
exports.getDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find()
      .populate("reporter", "name email")
      .populate("reportedUser", "name email")
      .populate("resolvedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      disputes,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── Resolve Dispute with Granular Action & Audit Log ───────────────────
exports.resolveDispute = async (req, res) => {
  try {
    const { action = "dismiss", resolutionNote = "", status = "Resolved" } = req.body;

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found" });
    }

    dispute.status = status;
    dispute.resolutionAction = action;
    dispute.resolutionNote = resolutionNote.trim();
    dispute.resolvedBy = req.user.id;
    dispute.resolvedAt = new Date();

    // Execute moderation action if requested
    if (action === "remove_content") {
      if (dispute.targetType === "listing" && dispute.targetId) {
        await SkillListing.findByIdAndUpdate(dispute.targetId, { isActive: false });
      } else if (dispute.targetType === "review" && dispute.targetId) {
        await Review.findByIdAndDelete(dispute.targetId);
      } else if (dispute.targetType === "user" && dispute.reportedUser) {
        await User.findByIdAndUpdate(dispute.reportedUser, {
          isSuspended: true,
          suspensionReason: `Account suspended following resolution of dispute #${dispute._id}`,
        });
      }
    } else if (action === "warn_user" && dispute.reportedUser) {
      const io = req.app.get("io");
      await createNotification({
        userId: dispute.reportedUser,
        title: "Official Policy Warning ⚠️",
        message: `An admin reviewed a report regarding your activity. Note: ${resolutionNote || "Please adhere to community guidelines."}`,
        type: "general",
        link: "/dashboard",
        io,
      });
    }

    await dispute.save();

    res.json({
      success: true,
      message: `Dispute ${status} with action: ${action}`,
      dispute,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};