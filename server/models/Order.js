const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    dailyProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DailyProduct",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    variety: {
      type: String,
      default: "",
      trim: true,
    },

    // Snapshot of the image at order time
    image: {
      type: String,
      default: "",
      trim: true,
    },

    // Number of selling portions
    //
    // 2 × 150g = quantity 2
    quantity: {
      type: Number,
      required: true,
      min: 0.001,
    },

    // Amount represented by ONE quantity
    //
    // 150g rate -> 150
    rateQuantity: {
      type: Number,
      required: true,
      min: 0.001,
      default: 1,
    },

    unit: {
      type: String,
      required: true,
      enum: ["piece", "g", "kg"],
    },

    rateText: {
      type: String,
      default: "",
      trim: true,
    },

    // Price of ONE selling portion
    //
    // 200/150g -> 200
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // This references your Customer model.
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },

    fulfillmentMethod: {
      type: String,
      enum: ["pickup", "delivery"],
      default: "pickup",
    },

    deliveryAddress: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,

      validate: {
        validator: (items) => items.length > 0,
        message: "Order must contain at least one item",
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["razorpay", "cash"],
      default: "razorpay",
    },

    razorpayOrderId: {
      type: String,
      default: "",
    },

    razorpayPaymentId: {
      type: String,
      default: "",
    },

    razorpaySignature: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Order",
  orderSchema
);