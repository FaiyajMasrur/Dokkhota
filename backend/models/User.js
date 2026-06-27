// Mongoose User schema for Dokkhota user accounts and profile data
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    creditBalance: { type: Number, default: 0 },
    heldCredits: { type: Number, default: 0 },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '' },
    city: { type: String, default: '' },
    languages: [{ type: String }],
    skillsOffered: [{ type: mongoose.Schema.Types.Mixed }],
    skillsWanted: [{ type: String }],
    isVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    streakCount: { type: Number, default: 0 },
    lastSessionWeek: { type: Date },
    otpCode: { type: String },
    otpExpiry: { type: Date },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.passwordHash);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.resetToken;
    delete ret.resetTokenExpiry;
    delete ret.otpCode;
    delete ret.otpExpiry;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
