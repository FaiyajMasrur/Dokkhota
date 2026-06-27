// User routes for Dokkhota profile management
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getUserProfile,
  updateProfile,
  updateSkillsOffered,
} = require('../controllers/userController');

router.get('/:userId/profile', getUserProfile);
router.patch('/profile', authMiddleware, updateProfile);
router.patch('/skills-offered', authMiddleware, updateSkillsOffered);

module.exports = router;
