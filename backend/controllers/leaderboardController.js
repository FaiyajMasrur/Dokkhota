const User = require("../models/User");

exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find(
      { role: "user" },
      "name creditBalance isVerified avatarUrl"
    )
      .sort({ creditBalance: -1 })
      .limit(10);

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