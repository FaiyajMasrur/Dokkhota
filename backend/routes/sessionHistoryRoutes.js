const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const sessionController = require("../controllers/sessionHistoryController");

router.get("/", authMiddleware, sessionController.getSessionHistory);

module.exports = router;