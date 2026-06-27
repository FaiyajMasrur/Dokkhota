// User controller for Dokkhota profile retrieval and updates
const User = require('../models/User');

const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('-passwordHash -resetToken -resetTokenExpiry -otpCode -otpExpiry');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, avatarUrl, bio, city, languages } = req.body;
    if (name) user.name = name.trim();
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (city !== undefined) user.city = city.trim();
    if (languages !== undefined) {
      user.languages = Array.isArray(languages)
        ? languages.map((l) => l.trim()).filter(Boolean)
        : languages.split(',').map((l) => l.trim()).filter(Boolean);
    }

    await user.save();
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return next(error);
  }
};

const updateSkillsOffered = async (req, res, next) => {
  try {
    const { skillsOffered } = req.body;
    if (!Array.isArray(skillsOffered)) {
      return res.status(400).json({ success: false, message: 'skillsOffered must be an array' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.skillsOffered = skillsOffered.map((skill) => ({
      title: skill.title?.trim() || '',
      category: skill.category?.trim() || '',
      description: skill.description?.trim() || '',
    })).filter((skill) => skill.title && skill.category);

    await user.save();
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  updateSkillsOffered,
};
