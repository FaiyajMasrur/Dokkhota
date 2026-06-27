// Credit transaction ledger model for Dokkhota users
const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['earn', 'spend', 'hold', 'refund', 'penalty', 'starter'],
      required: true,
    },
    amount: { type: Number, required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

creditTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('CreditTransaction', creditTransactionSchema);
