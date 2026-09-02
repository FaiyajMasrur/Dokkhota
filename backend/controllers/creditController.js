
const User = require("../models/User");
const CreditTransaction = require("../models/CreditTransaction");

//  credit balance
const getCreditBalance = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      "creditBalance heldCredits"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      creditBalance: user.creditBalance,
      heldCredits: user.heldCredits,
      availableBalance: user.creditBalance,
    });
  } catch (error) {
    return next(error);
  }
};

// credit transaction history
const listTransactions = async (req, res, next) => {
  try {
    const transactions = await CreditTransaction.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCreditBalance,
  listTransactions,
};