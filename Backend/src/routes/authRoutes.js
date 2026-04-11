const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  registerUser,
  loginUser,
  analyzeRisk,
  verifyPattern,
  verifyOtp,
  submitHoneypotOtp,
  getCurrentUser
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/analyze-risk", analyzeRisk);
router.post("/verify-pattern", verifyPattern);
router.post("/verify-otp", verifyOtp);
router.post("/honeypot-otp", submitHoneypotOtp);
router.get("/me", authMiddleware, getCurrentUser);

module.exports = router;
