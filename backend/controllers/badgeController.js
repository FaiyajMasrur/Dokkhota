const SkillBadge = require('../models/SkillBadge');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Multer config for proof file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const uniqueName = `badge_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only images (jpg, png, webp) and PDFs are allowed'));
  },
});

const uploadProof = upload.single('proof');

//Badge Req Submit
const submitBadgeRequest = async (req, res, next) => {
  try {
    const { skillName, description, proofType } = req.body;
    const userId = req.user.id;

    if (!skillName) {
      return res.status(400).json({ success: false, message: 'Skill name is required' });
    }

    const proofUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const badge = new SkillBadge({
      userId,
      skillName,
      description: description || '',
      proofUrl,
      proofType: proofType || 'other',
    });

    await badge.save();
    return res.status(201).json({ success: true, badge });
  } catch (error) {
    return next(error);
  }
};

// badge req user
const getMyBadges = async (req, res, next) => {
  try {
    const badges = await SkillBadge.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, badges });
  } catch (error) {
    return next(error);
  }
};

//approved badges > sp user
const getUserBadges = async (req, res, next) => {
  try {
    const badges = await SkillBadge.find({
      userId: req.params.userId,
      status: 'approved',
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, badges });
  } catch (error) {
    return next(error);
  }
};
//Pending Req >Admin

const getPendingBadges = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const badges = await SkillBadge.find({ status: 'pending' })
      .populate('userId', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, badges });
  } catch (error) {
    return next(error);
  }
};

//Badge_Req_Get>Admin
const getAllBadges = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const badges = await SkillBadge.find()
      .populate('userId', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, badges });
  } catch (error) {
    return next(error);
  }
};

//Badge Acc/Rej
const reviewBadge = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { badgeId } = req.params;
    const { status, adminNote } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const badge = await SkillBadge.findById(badgeId);
    if (!badge) {
      return res.status(404).json({ success: false, message: 'Badge request not found' });
    }

    badge.status = status;
    badge.adminNote = adminNote || '';
    badge.reviewedBy = req.user.id;
    badge.reviewedAt = new Date();
    await badge.save();

    //Verific...
    if (status === 'approved') {
      await User.findByIdAndUpdate(badge.userId, { isVerified: true });
    }

    await badge.populate('userId', 'name email avatarUrl');

    return res.status(200).json({ success: true, badge });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  uploadProof,
  submitBadgeRequest,
  getMyBadges,
  getUserBadges,
  getPendingBadges,
  getAllBadges,
  reviewBadge,
};