const express = require("express");

const router = express.Router();

const {
  createReview,
  getProductReviews,
  getMyReviews,
} = require("../controllers/reviewController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.post(
  "/",
  protect,
  createReview
);

router.get(
  "/product/:productId",
  getProductReviews
);

router.get(
  "/my-reviews",
  protect,
  getMyReviews
);

module.exports = router;