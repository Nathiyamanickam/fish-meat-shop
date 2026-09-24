const express = require("express");

const router = express.Router();

const {
  getCustomerAnalytics,
} = require(
  "../controllers/customerAnalyticsController"
);

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

router.get(
  "/",
  protect,
  adminOnly,
  getCustomerAnalytics
);

module.exports = router;