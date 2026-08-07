const Session = require("../models/Session");

exports.getSessionHistory = async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [
        { teacherId: req.user.id },
        { learnerId: req.user.id },
      ],
    })
      .populate("teacherId", "name")
      .populate("learnerId", "name")
      .sort({ sessionDate: -1 });

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