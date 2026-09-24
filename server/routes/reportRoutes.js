const express = require("express");

const router = express.Router();

const {
  getSalesSummary,
  getSalesByDateRange,
  getPaymentReport,
} = require("../controllers/reportController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

router.get(
  "/summary",
  protect,
  adminOnly,
  getSalesSummary
);

router.get(
  "/sales",
  protect,
  adminOnly,
  getSalesByDateRange
);

router.get(
  "/payments",
  protect,
  adminOnly,
  getPaymentReport
);

module.exports = router;