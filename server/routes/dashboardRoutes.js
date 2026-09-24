const express = require("express");

const router = express.Router();

const {
  getDashboardStats,
  getSalesOverview,
} = require("../controllers/dashboardController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

router.get(
  "/stats",
  protect,
  adminOnly,
  getDashboardStats
);

// ==========================================
// SALES OVERVIEW
// ==========================================

router.get(
  "/sales",
  protect,
  adminOnly,
  getSalesOverview
);

module.exports = router;