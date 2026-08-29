// Skill request model for Dokkhota request board posts
const mongoose = require('mongoose');

const skillRequestSchema = new mongoose.Schema(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    currentLevel: { type: String, enum: ['beginner', 'intermediate', 'expert'], default: 'beginner' },
    preferredFormat: { type: String, enum: ['online', 'in-person'], default: 'online' },
    preferredBudget: { type: Number, default: 0, min: 0 },
    availableTimeSlots: { type: String, default: '', trim: true },
    status: { type: String, enum: ['open', 'matched', 'closed'], default: 'open' },
    tags: [{ type: String, trim: true }],
    responses: [
      {
        responderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, default: '' },
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

skillRequestSchema.index({ title: 'text', description: 'text', category: 'text', tags: 'text' });

module.exports = mongoose.model('SkillRequest', skillRequestSchema);
