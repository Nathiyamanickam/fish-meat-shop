const express = require("express");

const router = express.Router();

const {
  createOrder,
  createRazorpayOrder,
  verifyPayment,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/orderController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

// ==========================================================
// CUSTOMER
// ==========================================================

router.post(
  "/",
  protect,
  createOrder
);

router.get(
  "/my-orders",
  protect,
  getMyOrders
);

// ==========================================================
// ADMIN
// ==========================================================

router.get(
  "/admin/all",
  protect,
  adminOnly,
  getAllOrders
);

router.put(
  "/:id/status",
  protect,
  adminOnly,
  updateOrderStatus
);

// ==========================================================
// PAYMENT
// ==========================================================

router.post(
  "/razorpay/create",
  protect,
  createRazorpayOrder
);

router.post(
  "/razorpay/verify",
  protect,
  verifyPayment
);

// ==========================================================
// CUSTOMER CANCEL
// ==========================================================

router.put(
  "/:id/cancel",
  protect,
  cancelOrder
);

// ==========================================================
// SINGLE ORDER
// ==========================================================

router.get(
  "/:id",
  protect,
  getOrderById
);

module.exports = router;