// User controller for Dokkhota profile retrieval and updates
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

let cloudinary;
try {
  cloudinary = require('cloudinary').v2;
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  } else {
    cloudinary = null;
  }
} catch (e) {
  cloudinary = null;
}

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

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let url;
    if (cloudinary) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'dokkhota/avatars' });
      url = result.secure_url;
      // remove temp file
      fs.unlink(req.file.path, () => {});
    } else {
      // keep file in uploads/ and serve statically
      const publicPath = `/uploads/${path.basename(req.file.path)}`;
      url = publicPath;
    }

    user.avatarUrl = url;
    await user.save();
    return res.status(200).json({ success: true, avatarUrl: url });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  updateSkillsOffered,
  uploadAvatar,
};
