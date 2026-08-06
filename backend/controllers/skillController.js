// Skill listing controller for Dokkhota skill creation, retrieval, and search.
const SkillListing = require('../models/SkillListing');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
    const {
      q,
      category,
      level,
      proficiencyLevel,
      format,
      minCredits,
      maxCredits,
      dayAvailable,
      page = '1',
      limit = '12',
      sortBy = 'recent',
    } = req.query;

    const cleanedQuery = q?.trim();
    const cleanedCategory = category?.trim();
    const cleanedLevel = level?.trim() || proficiencyLevel?.trim();
    const cleanedFormat = format?.trim();
    const cleanedDay = dayAvailable?.trim();

    const filters = { isActive: true };
    if (cleanedCategory) {
      filters.category = new RegExp(`^${escapeRegExp(cleanedCategory)}$`, 'i');
    }
    if (cleanedLevel) {
      filters.proficiencyLevel = cleanedLevel;
    }
    if (cleanedFormat) {
      filters.format = cleanedFormat;
    }
    if (minCredits !== undefined && minCredits !== '') {
      filters.creditCost = { ...(filters.creditCost || {}), $gte: Number(minCredits) };
    }
    if (maxCredits !== undefined && maxCredits !== '') {
      filters.creditCost = { ...(filters.creditCost || {}), $lte: Number(maxCredits) };
    }
    if (cleanedDay) {
      filters.availability = { $elemMatch: { day: new RegExp(`^${escapeRegExp(cleanedDay)}$`, 'i') } };
    }

    const currentPage = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 12, 1), 50);

    const searchFilter = cleanedQuery
      ? { ...filters, $text: { $search: cleanedQuery } }
      : filters;

    const sortOptions = {
      recent: { createdAt: -1 },
      credits_asc: { creditCost: 1, createdAt: -1 },
      credits_desc: { creditCost: -1, createdAt: -1 },
      rating_desc: { averageRating: -1, totalSessions: -1, createdAt: -1 },
      title_asc: { title: 1 },
    };

    const selectedSort = sortOptions[sortBy] || sortOptions.recent;

    const listings = await SkillListing.find(searchFilter)
      .populate('teacherId', 'name avatarUrl city')
      .sort(selectedSort)
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    const totalResults = await SkillListing.countDocuments(searchFilter);

    return res.status(200).json({
      success: true,
      listings,
      page: currentPage,
      limit: pageSize,
      totalResults,
      totalPages: Math.max(Math.ceil(totalResults / pageSize), 1),
    });
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
