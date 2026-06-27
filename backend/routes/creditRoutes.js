// Credit routes for Dokkhota
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getCreditBalance, listTransactions } = require('../controllers/creditController');

router.get('/balance', authMiddleware, getCreditBalance);
router.get('/transactions', authMiddleware, listTransactions);

module.exports = router;
