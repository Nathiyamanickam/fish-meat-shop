const mongoose = require("mongoose");

const dailyProductSchema = new mongoose.Schema(
  {
    // Master product
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Admin can type ANY variety
    // Example:
    // Chicken 65
    // Chicken Lollipop
    // Vanjaram Fish Fry
    variety: {
      type: String,
      required: true,
      trim: true,
    },

    // YYYY-MM-DD
    date: {
      type: String,
      required: true,
      trim: true,
    },

    // Admin-entered rate
    //
    // Examples:
    // 30/piece
    // 400/kg
    // 200/150g
    // ₹250/500g
    rate: {
      type: String,
      required: true,
      trim: true,
    },

    // Price for ONE selling portion
    //
    // 30/piece  -> 30
    // 400/kg    -> 400
    // 200/150g  -> 200
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Amount represented by one selling portion
    //
    // 30/piece  -> 1
    // 400/kg    -> 1
    // 200/150g  -> 150
    // 250/500g  -> 500
    rateQuantity: {
      type: Number,
      required: true,
      min: 0.001,
      default: 1,
    },

    // Selling unit
    unit: {
      type: String,
      required: true,
      enum: ["piece", "g", "kg"],
      lowercase: true,
      trim: true,
    },

    // IMPORTANT:
    // Image belongs to this DAILY VARIETY.
    image: {
      type: String,
      trim: true,
      default: "",
    },

    // Admin display text
    //
    // Examples:
    // 20 pieces
    // 15 kg
    // 5 packets
    availableQuantity: {
      type: String,
      required: true,
      trim: true,
    },

    // Number of selling portions available
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Same product can have multiple varieties on the same date.
dailyProductSchema.index(
  {
    product: 1,
    date: 1,
    variety: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "DailyProduct",
  dailyProductSchema
);