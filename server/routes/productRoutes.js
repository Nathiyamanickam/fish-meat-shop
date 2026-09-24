const express = require("express");

const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} = require("../controllers/productController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const {
  uploadProductImageFile,
} = require("../middleware/uploadMiddleware");

// ======================================================
// GET ALL PRODUCTS
// ======================================================

router.get(
  "/",
  protect,
  adminOnly,
  getProducts
);

// ======================================================
// CREATE PRODUCT
// ======================================================

router.post(
  "/",
  protect,
  adminOnly,
  createProduct
);

// ======================================================
// GET SINGLE PRODUCT
// ======================================================

router.get(
  "/:id",
  protect,
  adminOnly,
  getProductById
);

// ======================================================
// UPLOAD PRODUCT IMAGE
// IMPORTANT: BEFORE /:id
// ======================================================

router.put(
  "/:id/image",
  protect,
  adminOnly,
  uploadProductImageFile,
  uploadProductImage
);

// ======================================================
// UPDATE PRODUCT
// ======================================================

router.put(
  "/:id",
  protect,
  adminOnly,
  updateProduct
);

// ======================================================
// DELETE PRODUCT
// ======================================================

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteProduct
);

module.exports = router;