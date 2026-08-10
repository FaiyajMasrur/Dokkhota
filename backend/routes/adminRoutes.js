const express = require("express");
const router = express.Router();

const admin = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware("admin"));

router.get("/dashboard", admin.getDashboard);
router.get("/users", admin.getUsers);
router.put("/users/:id/suspend", admin.suspendUser);
router.put("/users/:id/unsuspend", admin.unsuspendUser);
router.delete("/users/:id", admin.deleteUser);

router.get("/disputes", admin.getDisputes);
router.put("/disputes/:id", admin.resolveDispute);

module.exports = router;