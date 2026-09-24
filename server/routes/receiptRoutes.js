const express = require("express");

const router = express.Router();

const {
  generateReceipt,
} = require("../controllers/receiptController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.get(
  "/:id",
  protect,
  generateReceipt
);

module.exports = router;