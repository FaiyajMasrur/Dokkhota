const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    skill: {
      type: String,
      required: true,
    },

    sessionDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Completed", "Cancelled"],
      default: "Completed",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Session", sessionSchema);