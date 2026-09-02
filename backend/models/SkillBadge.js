const mongoose = require('mongoose');

const skillBadgeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skillName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    proofUrl: {
      type: String,
      default: '',
    },
    proofType: {
      type: String,
      enum: ['certificate', 'portfolio', 'degree', 'experience', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

skillBadgeSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('SkillBadge', skillBadgeSchema);
