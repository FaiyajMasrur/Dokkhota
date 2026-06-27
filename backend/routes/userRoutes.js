// User routes for Dokkhota profile management
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const {
  getUserProfile,
  updateProfile,
  updateSkillsOffered,
} = require('../controllers/userController');

const { uploadAvatar } = require('../controllers/userController');

router.get('/:userId/profile', getUserProfile);
router.patch('/profile', authMiddleware, updateProfile);
router.post('/profile/avatar', authMiddleware, upload.single('avatar'), uploadAvatar);
router.patch('/skills-offered', authMiddleware, updateSkillsOffered);

module.exports = router;
