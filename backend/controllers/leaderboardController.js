const User = require("../models/User");
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const SkillListing = require("../models/SkillListing");

exports.getLeaderboard = async (req, res) => {
  try {
    const { sortBy = "rating", category } = req.query;

    let userFilter = { role: "user" };

    if (category && category.trim()) {
      const cleanCat = category.trim();
      const matchingTeachers = await SkillListing.find({
        category: new RegExp(`^${cleanCat}$`, "i"),
      }).distinct("teacherId");

      userFilter = {
        role: "user",
        $or: [
          { _id: { $in: matchingTeachers } },
          { "skillsOffered.category": new RegExp(`^${cleanCat}$`, "i") },
        ],
      };
    }

    // Fetch matching non-admin users
    const users = await User.find(
      userFilter,
      "name email avatarUrl creditBalance isVerified streakCount bio city skillsOffered"
    ).lean();

    // Fetch review metrics for each user
    const reviews = await Review.aggregate([
      {
        $group: {
          _id: "$revieweeId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const reviewMap = {};
    reviews.forEach((r) => {
      reviewMap[r._id.toString()] = {
        averageRating: Math.round(r.averageRating * 10) / 10,
        totalReviews: r.totalReviews,
      };
    });

    // Fetch completed sessions count for each user (as teacher)
    const completedSessions = await Booking.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$teacherId",
          completedCount: { $sum: 1 },
        },
      },
    ]);

    const sessionMap = {};
    completedSessions.forEach((s) => {
      sessionMap[s._id.toString()] = s.completedCount;
    });

    // Merge statistics into user objects
    let leaderboard = users.map((u) => {
      const uId = u._id.toString();
      const r = reviewMap[uId] || { averageRating: 5.0, totalReviews: 0 };
      const completedCount = sessionMap[uId] || 0;

      return {
        ...u,
        averageRating: r.averageRating,
        totalReviews: r.totalReviews,
        completedSessions: completedCount,
        streakCount: u.streakCount || 0,
      };
    });

    // Sort leaderboard based on requested criteria
    if (sortBy === "sessions") {
      leaderboard.sort((a, b) => b.completedSessions - a.completedSessions || b.averageRating - a.averageRating);
    } else if (sortBy === "credits") {
      leaderboard.sort((a, b) => b.creditBalance - a.creditBalance || b.averageRating - a.averageRating);
    } else {
      // Default: sort by average rating, then total reviews, then completed sessions
      leaderboard.sort(
        (a, b) =>
          b.averageRating - a.averageRating ||
          b.totalReviews - a.totalReviews ||
          b.completedSessions - a.completedSessions
      );
    }

    res.json({
      success: true,
      users: leaderboard.slice(0, 20),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};