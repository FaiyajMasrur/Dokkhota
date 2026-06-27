// Category controller for Dokkhota categories
const Category = require('../models/Category');

const listCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    return next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const category = new Category({
      name: name.trim(),
      description: description?.trim() || '',
      createdBy: req.user?.id,
    });

    await category.save();
    return res.status(201).json({ success: true, category });
  } catch (error) {
    return next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { name, description, isActive } = req.body;
    if (name !== undefined) category.name = name.trim();
    if (description !== undefined) category.description = description.trim();
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    return res.status(200).json({ success: true, category });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
};
