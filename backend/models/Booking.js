// Booking model for Dokkhota session requests
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillListing', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    preferredDate: { type: String, required: true },
    preferredTime: { type: String, required: true },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
    },
    creditCost: { type: Number, required: true, min: 1 },
    heldCredits: { type: Number, default: 0 },
  },
  { timestamps: true }
);

bookingSchema.index({ teacherId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
