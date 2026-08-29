// User routes for Dokkhota profile management
const path = require('path');
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueName = `avatar_${req.user.id}_${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext || mime) return cb(null, true);
    cb(new Error('Only image files (JPG, PNG, WebP, GIF) are allowed'));
  },
});
const {
  getUserProfile,
  updateProfile,
  updateSkillsOffered,
  uploadAvatar,
} = require('../controllers/userController');

router.get('/:userId/profile', getUserProfile);
router.patch('/profile', authMiddleware, updateProfile);
router.post('/profile/avatar', authMiddleware, upload.single('avatar'), uploadAvatar);
router.patch('/skills-offered', authMiddleware, updateSkillsOffered);

module.exports = router;
