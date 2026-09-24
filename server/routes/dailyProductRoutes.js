const express = require("express");

const router = express.Router();

// ======================================================
// CONTROLLERS
// ======================================================

const {
  createDailyProduct,
  getDailyProducts,
  getDailyProductById,
  updateDailyProduct,
  deleteDailyProduct,
  getTodayProducts,
  uploadDailyProductImage,
} = require("../controllers/dailyProductController");

// ======================================================
// MIDDLEWARE
// ======================================================

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const {
  uploadProductImageFile,
} = require("../middleware/uploadMiddleware");

// ======================================================
// CUSTOMER
// IMPORTANT:
// /today MUST COME BEFORE /:id
// ======================================================

router.get(
  "/today",
  protect,
  getTodayProducts
);

// ======================================================
// ADMIN - GET ALL
// ======================================================

router.get(
  "/",
  protect,
  adminOnly,
  getDailyProducts
);

// ======================================================
// ADMIN - CREATE
// ======================================================

router.post(
  "/",
  protect,
  adminOnly,
  createDailyProduct
);

// ======================================================
// ADMIN - GET SINGLE
// ======================================================

router.get(
  "/:id",
  protect,
  adminOnly,
  getDailyProductById
);

// ======================================================
// ADMIN - DAILY IMAGE UPLOAD
// ======================================================

router.put(
  "/:id/image",
  protect,
  adminOnly,
  uploadProductImageFile,
  uploadDailyProductImage
);

// ======================================================
// ADMIN - UPDATE
// ======================================================

router.put(
  "/:id",
  protect,
  adminOnly,
  updateDailyProduct
);

// ======================================================
// ADMIN - DELETE
// ======================================================

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteDailyProduct
);

module.exports = router;