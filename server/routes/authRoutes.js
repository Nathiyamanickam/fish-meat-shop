const express = require("express");

const router = express.Router();

const {
  customerLogin,
  adminLogin,
  getMe,
} = require("../controllers/authController");

const {
  protect,
} = require("../middleware/authMiddleware");

// Customer login
router.post("/customer/login", customerLogin);

// Admin login
router.post("/admin/login", adminLogin);

// Current logged-in user
router.get("/me", protect, getMe);

module.exports = router;