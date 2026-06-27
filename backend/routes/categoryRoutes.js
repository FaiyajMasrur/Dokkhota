// Category routes for Dokkhota
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { listCategories, createCategory, updateCategory } = require('../controllers/categoryController');

router.get('/', listCategories);
router.post('/', authMiddleware, roleMiddleware('admin'), createCategory);
router.patch('/:categoryId', authMiddleware, roleMiddleware('admin'), updateCategory);

module.exports = router;
