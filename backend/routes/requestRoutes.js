// Request routes for Dokkhota
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createRequest,
  listRequests,
  listMyRequests,
  respondToRequest,
  updateResponseStatus,
} = require('../controllers/requestController');

router.post('/', authMiddleware, createRequest);
router.get('/', authMiddleware, listRequests);
router.get('/mine', authMiddleware, listMyRequests);
router.post('/:requestId/respond', authMiddleware, respondToRequest);
router.patch('/:requestId/respond', authMiddleware, updateResponseStatus);

module.exports = router;
