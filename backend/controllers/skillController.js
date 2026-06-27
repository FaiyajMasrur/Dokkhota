// Skill listing controller for Dokkhota skill creation, retrieval, and search
const SkillListing = require('../models/SkillListing');

const createListing = async (req, res, next) => {
  try {
    const { title, category, description, format, durationMinutes, creditCost, proficiencyLevel, tags, availability } = req.body;
    const listing = new SkillListing({
      teacherId: req.user.id,
      title: title?.trim(),
      category: category?.trim(),
      description: description?.trim(),
      format,
      durationMinutes,
      creditCost,
      proficiencyLevel,
      tags: tags || [],
      availability: availability || [],
    });
    await listing.save();
    return res.status(201).json({ success: true, listing });
  } catch (error) {
    return next(error);
  }
};

const updateListing = async (req, res, next) => {
  try {
    const listing = await SkillListing.findById(req.params.listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    if (listing.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updates = ['title', 'category', 'description', 'format', 'durationMinutes', 'creditCost', 'proficiencyLevel', 'tags', 'availability'];
    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        listing[field] = req.body[field];
      }
    });
    await listing.save();
    return res.status(200).json({ success: true, listing });
  } catch (error) {
    return next(error);
  }
};

const toggleListing = async (req, res, next) => {
  try {
    const listing = await SkillListing.findById(req.params.listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    if (listing.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    listing.isActive = !listing.isActive;
    await listing.save();
    return res.status(200).json({ success: true, listing });
  } catch (error) {
    return next(error);
  }
};

const deleteListing = async (req, res, next) => {
  try {
    const listing = await SkillListing.findById(req.params.listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    if (listing.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await listing.remove();
    return res.status(200).json({ success: true, message: 'Listing deleted' });
  } catch (error) {
    return next(error);
  }
};

const getMyListings = async (req, res, next) => {
  try {
    const listings = await SkillListing.find({ teacherId: req.user.id });
    return res.status(200).json({ success: true, listings });
  } catch (error) {
    return next(error);
  }
};

const getListingById = async (req, res, next) => {
  try {
    const listing = await SkillListing.findById(req.params.listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    return res.status(200).json({ success: true, listing });
  } catch (error) {
    return next(error);
  }
};

const searchListings = async (req, res, next) => {
  try {
    const { q, category, proficiencyLevel, format, minCredits, maxCredits, limit } = req.query;
    const filters = { isActive: true };
    if (category) filters.category = category;
    if (proficiencyLevel) filters.proficiencyLevel = proficiencyLevel;
    if (format) filters.format = format;
    if (minCredits) filters.creditCost = { ...filters.creditCost, $gte: Number(minCredits) };
    if (maxCredits) filters.creditCost = { ...filters.creditCost, $lte: Number(maxCredits) };

    let query = SkillListing.find(filters);
    if (q) {
      query = query.find({ $text: { $search: q } });
    }
    const maxResults = Math.min(Number(limit) || 50, 50);
    const listings = await query.sort({ createdAt: -1 }).limit(maxResults);
    return res.status(200).json({ success: true, listings });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createListing,
  updateListing,
  toggleListing,
  deleteListing,
  getMyListings,
  getListingById,
  searchListings,
};
