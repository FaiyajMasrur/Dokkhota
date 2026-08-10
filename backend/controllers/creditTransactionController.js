const CreditTransaction = require("../models/CreditTransaction");

// Get credit transaction history for the logged-in user
const getMyCreditTransactions = async (req, res, next) => {
  try {
    const transactions = await CreditTransaction.find({
      userId: req.user.id,
    })
      .populate("sessionId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMyCreditTransactions,
};