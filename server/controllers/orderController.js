const crypto = require("crypto");

const Order = require("../models/Order");
const Customer = require("../models/Customer");
const DailyProduct = require("../models/DailyProduct");

const razorpay = require("../config/razorpay");

const {
  notifyOrderPlaced,
  notifyOrderStatus,
} = require("../services/notificationService");

// ==========================================
// GENERATE ORDER NUMBER
// ==========================================

const generateOrderNumber = () => {
  const timestamp = Date.now();

  const random = Math.floor(
    1000 + Math.random() * 9000
  );

  return `FC-${timestamp}-${random}`;
};

// ==========================================
// CREATE ORDER
// ==========================================

const createOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      fulfillmentMethod = "pickup",
      deliveryAddress = "",
      city = "",
      items,
    } = req.body;

    // ========================================
    // CUSTOMER VALIDATION
    // ========================================

    const cleanName =
      String(customerName || "").trim();

    const cleanPhone =
      String(customerPhone || "").trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    if (!cleanPhone) {
      return res.status(400).json({
        success: false,
        message:
          "Customer phone number is required",
      });
    }

    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 10-digit phone number",
      });
    }

    // ========================================
    // FULFILLMENT
    // ========================================

    if (
      !["pickup", "delivery"].includes(
        fulfillmentMethod
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid fulfillment method",
      });
    }

    if (fulfillmentMethod === "delivery") {
      if (!String(deliveryAddress).trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Delivery address is required",
        });
      }

      if (!String(city).trim()) {
        return res.status(400).json({
          success: false,
          message: "City is required",
        });
      }
    }

    // ========================================
    // CART VALIDATION
    // ========================================

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // ========================================
    // FIND / CREATE CUSTOMER
    // ========================================

    // IMPORTANT:
    // Customer is imported at the top.
    let customer =
      await Customer.findOne({
        phone: cleanPhone,
      });

    if (!customer) {
      customer =
        await Customer.create({
          phone: cleanPhone,
          name: cleanName,
          address:
            fulfillmentMethod === "delivery"
              ? String(
                  deliveryAddress
                ).trim()
              : "",
          city:
            fulfillmentMethod === "delivery"
              ? String(city).trim()
              : "",
        });
    } else {
      customer.name = cleanName;

      if (
        fulfillmentMethod === "delivery"
      ) {
        customer.address =
          String(
            deliveryAddress
          ).trim();

        customer.city =
          String(city).trim();
      }

      await customer.save();
    }

    // ========================================
    // BUILD ORDER ITEMS
    // ========================================

    const orderItems = [];

    let subtotal = 0;

    for (const cartItem of items) {
      // --------------------------------------
      // ID
      // --------------------------------------

      if (
        !cartItem.dailyProductId ||
        !require("mongoose").Types.ObjectId.isValid(
          cartItem.dailyProductId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid daily product in cart",
        });
      }

      // --------------------------------------
      // FIND DAILY PRODUCT
      // --------------------------------------

      const dailyProduct =
        await DailyProduct.findById(
          cartItem.dailyProductId
        ).populate("product");

      if (!dailyProduct) {
        return res.status(400).json({
          success: false,
          message:
            "One of the products is no longer available",
        });
      }

      if (!dailyProduct.product) {
        return res.status(400).json({
          success: false,
          message:
            "Master product not found",
        });
      }

      // --------------------------------------
      // AVAILABILITY
      // --------------------------------------

      if (
        !dailyProduct.isAvailable ||
        !dailyProduct.product.isActive
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${dailyProduct.variety} is no longer available`,
        });
      }

      // --------------------------------------
      // QUANTITY
      // --------------------------------------

      const quantity =
        Number(cartItem.quantity);

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid quantity for ${dailyProduct.variety}`,
        });
      }

      // --------------------------------------
      // STOCK
      // --------------------------------------

      const stock =
        Number(
          dailyProduct.stockQuantity
        );

      if (
        Number.isFinite(stock) &&
        stock > 0 &&
        quantity > stock
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Only ${stock} portions available for ${dailyProduct.variety}`,
        });
      }

      // --------------------------------------
      // UNIT
      // --------------------------------------

      if (
        cartItem.unit &&
        cartItem.unit !==
          dailyProduct.unit
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${dailyProduct.variety} must be ordered in ${dailyProduct.unit}`,
        });
      }

      // --------------------------------------
      // PRICE
      // --------------------------------------

      const unitPrice =
        Number(
          dailyProduct.unitPrice
        );

      if (
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid price for ${dailyProduct.variety}`,
        });
      }

      // --------------------------------------
      // RATE QUANTITY
      // --------------------------------------

      const rateQuantity =
        Number(
          dailyProduct.rateQuantity
        );

      if (
        !Number.isFinite(
          rateQuantity
        ) ||
        rateQuantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid rate quantity for ${dailyProduct.variety}`,
        });
      }

      // --------------------------------------
      // TOTAL
      // --------------------------------------

      // 200/150g
      //
      // quantity 1 = ₹200
      // quantity 2 = ₹400
      // quantity 3 = ₹600

      const itemTotal =
        quantity * unitPrice;

      subtotal += itemTotal;

      // --------------------------------------
      // ORDER SNAPSHOT
      // --------------------------------------

      orderItems.push({
        dailyProduct:
          dailyProduct._id,

        product:
          dailyProduct.product._id,

        productName:
          dailyProduct.product.name,

        variety:
          dailyProduct.variety,

        // Daily variety image first
        image:
          dailyProduct.image ||
          dailyProduct.product.image ||
          "",

        quantity,

        rateQuantity,

        unit:
          dailyProduct.unit,

        rateText:
          dailyProduct.rate,

        unitPrice,

        totalPrice:
          itemTotal,
      });
    }

    // ========================================
    // DELIVERY FEE
    // ========================================

    const deliveryFee = 0;

    const totalAmount =
      subtotal + deliveryFee;

    // ========================================
    // CREATE ORDER
    // ========================================

    const order =
      await Order.create({
        orderNumber:
          generateOrderNumber(),

        customer:
          customer._id,

        customerName:
          cleanName,

        customerPhone:
          cleanPhone,

        fulfillmentMethod,

        deliveryAddress:
          fulfillmentMethod === "delivery"
            ? String(
                deliveryAddress
              ).trim()
            : "",

        city:
          fulfillmentMethod === "delivery"
            ? String(city).trim()
            : "",

        items:
          orderItems,

        subtotal,

        deliveryFee,

        totalAmount,

        orderStatus: "pending",

        paymentStatus: "pending",

        paymentMethod: "razorpay",
      });

    // ========================================
    // REAL-TIME ADMIN NOTIFICATION
    // ========================================

    const io = req.app.get("io");

    if (io) {
      io.to("admins").emit(
        "new_order",
        {
          _id: order._id,
          orderNumber:
            order.orderNumber,
          customerName:
            order.customerName,
          customerPhone:
            order.customerPhone,
          fulfillmentMethod:
            order.fulfillmentMethod,
          totalAmount:
            order.totalAmount,
          paymentStatus:
            order.paymentStatus,
          orderStatus:
            order.orderStatus,
          createdAt:
            order.createdAt,
        }
      );
    }

    // ========================================
    // SMS / WHATSAPP
    // ========================================

    notifyOrderPlaced(order).catch(
      (error) => {
        console.error(
          "Order notification error:",
          error.message
        );
      }
    );

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(201).json({
      success: true,

      message:
        "Order created successfully",

      order: {
        _id: order._id,

        orderNumber:
          order.orderNumber,

        customerName:
          order.customerName,

        customerPhone:
          order.customerPhone,

        fulfillmentMethod:
          order.fulfillmentMethod,

        subtotal:
          order.subtotal,

        deliveryFee:
          order.deliveryFee,

        totalAmount:
          order.totalAmount,

        paymentStatus:
          order.paymentStatus,

        orderStatus:
          order.orderStatus,
      },
    });
  } catch (error) {
    console.error(
      "===================================="
    );

    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    console.error(
      "MESSAGE:",
      error.message
    );

    console.error(
      "===================================="
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create order",
    });
  }
};

// ==========================================
// CREATE RAZORPAY ORDER
// ==========================================

const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.customer.toString() !==
      req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot pay for this order",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid",
      });
    }

    const amountInPaise = Math.round(
      Number(order.totalAmount) * 100
    );

    if (amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay amount must be at least ₹1",
      });
    }

    const razorpayOrder =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: order.orderNumber,
        notes: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
        },
      });

    order.razorpayOrderId =
      razorpayOrder.id;

    await order.save();

    res.json({
      success: true,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      keyId:
        process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error(
      "CREATE RAZORPAY ORDER ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.error?.description ||
        error.message ||
        "Failed to create Razorpay order",
    });
  }
};

// ==========================================
// VERIFY PAYMENT
// ==========================================

const verifyPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment verification details are missing",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.customer.toString() !==
      req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot verify this order",
      });
    }

    if (
      order.razorpayOrderId !==
      razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay order ID does not match",
      });
    }

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          razorpay_order_id +
            "|" +
            razorpay_payment_id
        )
        .digest("hex");

    const signaturesMatch =
      crypto.timingSafeEqual(
        Buffer.from(generatedSignature),
        Buffer.from(razorpay_signature)
      );

    if (!signaturesMatch) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment signature",
      });
    }

    const payment =
      await razorpay.payments.fetch(
        razorpay_payment_id
      );

    const expectedAmount = Math.round(
      Number(order.totalAmount) * 100
    );

    if (
      Number(payment.amount) !==
      expectedAmount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment amount does not match order amount",
      });
    }

    if (
      payment.order_id !==
      razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment does not belong to this Razorpay order",
      });
    }

    if (payment.status !== "captured") {
      order.paymentStatus = "pending";

      await order.save();

      return res.status(400).json({
        success: false,
        message:
          `Payment is ${payment.status}, not captured yet`,
      });
    }

    order.paymentStatus = "paid";

    order.razorpayPaymentId =
      razorpay_payment_id;

    order.razorpaySignature =
      razorpay_signature;

    await order.save();

    const io = req.app.get("io");

    if (io) {
      io.to("admins").emit(
        "payment_received",
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount,
        }
      );
    }

    res.json({
      success: true,
      message:
        "Payment verified successfully",
      order,
    });
  } catch (error) {
    console.error(
      "VERIFY PAYMENT ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.error?.description ||
        error.message ||
        "Payment verification failed",
    });
  }
};

// ==========================================
// GET ALL ORDERS - ADMIN
// ==========================================

const getAllOrders = async (
  req,
  res
) => {
  try {
    const {
      status,
      date,
      search,
    } = req.query;

    const filter = {};

    if (
      status &&
      status !== "all"
    ) {
      filter.orderStatus =
        status;
    }

    if (date) {
      const start =
        new Date(date);

      start.setHours(
        0,
        0,
        0,
        0
      );

      const end =
        new Date(date);

      end.setHours(
        23,
        59,
        59,
        999
      );

      filter.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    if (search) {
      const regex =
        new RegExp(
          search,
          "i"
        );

      filter.$or = [
        {
          orderNumber: regex,
        },
        {
          customerName: regex,
        },
        {
          customerPhone: regex,
        },
      ];
    }

    const orders =
      await Order.find(filter)
        .populate("customer")
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(
      "Get all orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get orders",
    });
  }
};

// ==========================================
// GET MY ORDERS - CUSTOMER
// ==========================================

const getMyOrders = async (
  req,
  res
) => {
  try {
    const phone =
      req.user?.phone;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message:
          "Customer phone not found",
      });
    }

    const orders =
      await Order.find({
        customerPhone: phone,
      })
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(
      "Get my orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get your orders",
    });
  }
};

// ==========================================
// GET SINGLE ORDER
// ==========================================

const getOrderById = async (
  req,
  res
) => {
  try {
    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found",
      });
    }

    if (
      req.user?.role !== "admin" &&
      order.customerPhone !==
        req.user?.phone
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot access this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "Get order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get order",
    });
  }
};

// ==========================================
// UPDATE ORDER STATUS - ADMIN
// ==========================================

// ==========================================================
// UPDATE ORDER STATUS - ADMIN
// ==========================================================

// ==========================================================
// UPDATE ORDER STATUS - ADMIN
// ==========================================================

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Accept both names for safety
    const newStatus =
      req.body.status ||
      req.body.orderStatus;

    console.log("=================================");
    console.log("UPDATE ORDER STATUS");
    console.log("ORDER ID:", id);
    console.log("NEW STATUS:", newStatus);
    console.log("=================================");

    const allowedStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "completed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const Order = require("../models/Order");

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update status
    order.orderStatus = newStatus;

    await order.save();

    console.log(
      "ORDER STATUS UPDATED:",
      order.orderNumber,
      "=>",
      order.orderStatus
    );

    // ======================================================
    // NOTIFICATION
    // ======================================================

    try {
      const {
        notifyOrderStatus,
      } = require("../services/notificationService");

      await notifyOrderStatus(order);
    } catch (notificationError) {
      console.log(
        "Notification error:",
        notificationError.message
      );
    }

    // ======================================================
    // SOCKET NOTIFICATION
    // ======================================================

    try {
      const io = req.app.get("io");

      if (io) {
        // Notify admin
        io.to("admins").emit(
          "order_status_updated",
          order
        );

        // Notify customer
        if (order.customerPhone) {
          io
            .to(`customer:${order.customerPhone}`)
            .emit(
              "order_status_updated",
              order
            );
        }
      }
    } catch (socketError) {
      console.log(
        "Socket error:",
        socketError.message
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error(
      "UPDATE ORDER STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update order status",
      error: error.message,
    });
  }
};

// ==========================================
// CANCEL ORDER - CUSTOMER
// ==========================================

const cancelOrder = async (
  req,
  res
) => {
  try {
    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found",
      });
    }

    // Customer can cancel only their own order
    if (
      req.user?.role !== "admin" &&
      order.customerPhone !==
        req.user?.phone
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot cancel this order",
      });
    }

    // IMPORTANT:
    // Customer can cancel ONLY while pending.
    //
    // Once admin confirms:
    // cancellation is disabled.
    if (
      order.orderStatus !==
      "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This order can no longer be cancelled",
      });
    }

    order.orderStatus =
      "cancelled";

    await order.save();

    const io =
      req.app.get("io");

    if (io) {
      io.to(
        `customer:${order.customerPhone}`
      ).emit(
        "order_status_updated",
        {
          orderId:
            order._id,
          orderNumber:
            order.orderNumber,
          orderStatus:
            "cancelled",
          paymentStatus:
            order.paymentStatus,
        }
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Cancel order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to cancel order",
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  createOrder,
  createRazorpayOrder,
  verifyPayment,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
};