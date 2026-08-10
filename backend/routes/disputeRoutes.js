const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const disputeController = require("../controllers/disputeController");

router.post("/", authMiddleware, disputeController.createDispute);

module.exports = router;
