// Request-board controller for Dokkhota skill requests and responses
const SkillRequest = require('../models/SkillRequest');

const createRequest = async (req, res, next) => {
  try {
    const { title, category, description, preferredFormat, preferredBudget, tags } = req.body;
    if (!title || !category || !description) {
      return res.status(400).json({ success: false, message: 'Title, category, and description are required' });
    }

    const request = new SkillRequest({
      requesterId: req.user.id,
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      preferredFormat: preferredFormat || 'online',
      preferredBudget: Number(preferredBudget || 0),
      tags: (tags || []).map((tag) => tag.trim()).filter(Boolean),
    });

    await request.save();
    return res.status(201).json({ success: true, request });
  } catch (error) {
    return next(error);
  }
};

const listRequests = async (req, res, next) => {
  try {
    const requests = await SkillRequest.find({ status: { $ne: 'closed' } })
      .populate('requesterId', 'name avatarUrl city')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, requests });
  } catch (error) {
    return next(error);
  }
};

const listMyRequests = async (req, res, next) => {
  try {
    const requests = await SkillRequest.find({ requesterId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, requests });
  } catch (error) {
    return next(error);
  }
};

const respondToRequest = async (req, res, next) => {
  try {
    const request = await SkillRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.requesterId.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot respond to your own request' });
    }

    const { message } = req.body;
    request.responses.push({
      responderId: req.user.id,
      message: message || '',
      status: 'pending',
    });

    await request.save();
    return res.status(200).json({ success: true, request });
  } catch (error) {
    return next(error);
  }
};

const updateResponseStatus = async (req, res, next) => {
  try {
    const request = await SkillRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.requesterId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { responseId, status } = req.body;
    const response = request.responses.id(responseId);
    if (!response) {
      return res.status(404).json({ success: false, message: 'Response not found' });
    }

    response.status = status;
    if (status === 'accepted') {
      request.status = 'matched';
    }
    await request.save();
    return res.status(200).json({ success: true, request });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createRequest,
  listRequests,
  listMyRequests,
  respondToRequest,
  updateResponseStatus,
};
