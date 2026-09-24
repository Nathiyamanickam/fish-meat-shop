const Order = require("../models/Order");

const getDateRange = (from, to) => {
  const start = new Date(`${from}T00:00:00.000+05:30`);
  const end = new Date(`${to}T23:59:59.999+05:30`);

  return { start, end };
};

// ==========================================
// GET SALES SUMMARY
// ==========================================

const getSalesSummary = async (req, res) => {
  try {
    const today = new Date();

    const todayString = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(today);

    const { start, end } = getDateRange(todayString, todayString);

    const paidOrders = await Order.find({
      paymentStatus: "paid",
      createdAt: {
        $gte: start,
        $lte: end,
      },
    }).sort({ createdAt: -1 });

    const todaySales = paidOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );

    const pendingPayments = await Order.countDocuments({
      paymentStatus: "pending",
    });

    const failedPayments = await Order.countDocuments({
      paymentStatus: "failed",
    });

    const refundedPayments = await Order.countDocuments({
      paymentStatus: "refunded",
    });

    const totalPaidOrders = await Order.countDocuments({
      paymentStatus: "paid",
    });

    const allPaidOrders = await Order.find({
      paymentStatus: "paid",
    }).select("totalAmount");

    const totalSales = allPaidOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );

    res.json({
      success: true,
      summary: {
        todaySales,
        todayPaidOrders: paidOrders.length,
        totalSales,
        totalPaidOrders,
        pendingPayments,
        failedPayments,
        refundedPayments,
      },
    });
  } catch (error) {
    console.error("SALES SUMMARY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load sales summary",
    });
  }
};

// ==========================================
// GET SALES BY DATE RANGE
// ==========================================

const getSalesByDateRange = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "from and to dates are required",
      });
    }

    const { start, end } = getDateRange(from, to);

    const orders = await Order.find({
      paymentStatus: "paid",
      createdAt: {
        $gte: start,
        $lte: end,
      },
    })
      .populate("customer", "name phone")
      .sort({ createdAt: -1 });

    const totalSales = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );

    res.json({
      success: true,
      from,
      to,
      totalSales,
      totalOrders: orders.length,
      orders,
    });
  } catch (error) {
    console.error("SALES RANGE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load sales report",
    });
  }
};

// ==========================================
// GET PAYMENT REPORT
// ==========================================

const getPaymentReport = async (req, res) => {
  try {
    const { status, from, to } = req.query;

    const filter = {};

    if (status && status !== "all") {
      filter.paymentStatus = status;
    }

    if (from && to) {
      const { start, end } = getDateRange(from, to);

      filter.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    const orders = await Order.find(filter)
      .populate("customer", "name phone")
      .sort({ createdAt: -1 });

    const totalAmount = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );

    res.json({
      success: true,
      totalAmount,
      totalOrders: orders.length,
      orders,
    });
  } catch (error) {
    console.error("PAYMENT REPORT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load payment report",
    });
  }
};

module.exports = {
  getSalesSummary,
  getSalesByDateRange,
  getPaymentReport,
};