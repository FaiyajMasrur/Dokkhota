// Authentication controller for Dokkhota registration, login, and password reset
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const { sendEmail } = require('../config/email');

const createAccessToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

const createRefreshToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

const sendVerificationEmail = async (user) => {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

  user.otpCode = otpCode;
  user.otpExpiry = otpExpiry;
  await user.save();

  const html = `<p>Your Dokkhota verification code is <strong>${otpCode}</strong>.</p><p>Expires in 15 minutes.</p>`;
  return sendEmail(user.email, 'Dokkhota Email Verification Code', html);
};

const register = async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const starterCredits = Number(process.env.STARTER_CREDITS || 10);

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password,
      creditBalance: starterCredits,
      heldCredits: 0,
      isVerified: false,
    });

    await user.save();

    try {
      const transaction = new CreditTransaction({
        userId: user._id,
        type: 'starter',
        amount: starterCredits,
        description: 'Welcome bonus — starter credits',
      });
      await transaction.save();
    } catch (transactionError) {
      await User.findByIdAndDelete(user._id);
      throw transactionError;
    }

    let emailResult;
    try {
      emailResult = await sendVerificationEmail(user);
    } catch (emailError) {
      return res.status(500).json({
        success: false,
        message: emailError.message || 'Registration saved, but email delivery failed. Check SMTP configuration.',
      });
    }

    const responsePayload = {
      success: true,
      message: emailResult.preview ? 'OTP generated successfully. Check the backend console for the code.' : 'OTP sent to email',
      emailPreview: !!emailResult.preview,
    };
    if (emailResult && emailResult.preview) {
      responsePayload.otp = user.otpCode;
    }
    return res.status(201).json(responsePayload);
  } catch (error) {
    return next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || user.otpCode !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: 'Email verified' });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isVerified) {
      let emailResult = {};
      try {
        emailResult = await sendVerificationEmail(user) || {};
      } catch (emailError) {
        // continue with verification guidance even if email delivery fails
      }
      const resp = {
        success: false,
        message: 'Email not verified',
        requiresVerification: true,
        email: user.email,
        emailPreview: !!emailResult.preview,
      };
      if (emailResult && emailResult.preview) {
        resp.otp = user.otpCode;
      }
      return res.status(403).json(resp);
    }
    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Account suspended' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        creditBalance: user.creditBalance,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token missing' });
    }
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const accessToken = createAccessToken(user);
    return res.status(200).json({ success: true, accessToken });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

const logout = async (req, res, next) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -resetToken -resetTokenExpiry -otpCode -otpExpiry');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const accessToken = createAccessToken(user);
    return res.status(200).json({ success: true, accessToken, user });
  } catch (error) {
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      user.resetToken = hashedToken;
      user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
      const html = `<p>Click the link below to reset your Dokkhota password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link is valid for 1 hour.</p>`;
      await sendEmail(user.email, 'Dokkhota Password Reset', html);
    }
    return res.status(200).json({ success: true, message: 'Reset email sent if account exists' });
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Token and password are required' });
  }
  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.passwordHash = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    return res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
};
