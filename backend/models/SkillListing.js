// Skill listing model for Dokkhota listings and teacher offerings
const mongoose = require('mongoose');

const skillListingSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    tags: [{ type: String, trim: true }],
    description: { type: String, required: true, trim: true },
    format: { type: String, enum: ['online', 'in-person'], required: true },
    durationMinutes: { type: Number, required: true, min: 15 },
    creditCost: { type: Number, required: true, min: 1 },
    proficiencyLevel: { type: String, enum: ['beginner', 'intermediate', 'expert'], required: true },
    isActive: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    availability: [{ day: String, slots: [String] }],
  },
  { timestamps: true }
);

skillListingSchema.index({ title: 'text', description: 'text', tags: 'text', category: 'text' });

module.exports = mongoose.model('SkillListing', skillListingSchema);
