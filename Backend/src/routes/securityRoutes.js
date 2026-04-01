const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
  getSecurityOverview,
  getAdminOverview,
  deleteUserByAdmin
} = require("../controllers/authController");

const router = express.Router();

router.get("/overview", authMiddleware, getSecurityOverview);
router.get("/admin-overview", authMiddleware, adminMiddleware, getAdminOverview);
router.delete("/users/:userId", authMiddleware, adminMiddleware, deleteUserByAdmin);

module.exports = router;
