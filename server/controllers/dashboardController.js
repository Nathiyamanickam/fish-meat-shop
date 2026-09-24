const Order = require("../models/Order");
const User = require("../models/User");

// ==========================================
// GET TODAY'S INDIA DATE RANGE
// ==========================================

const getTodayRange = () => {
  const now = new Date();

  const indiaDate = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(now);

  const start = new Date(
    `${indiaDate}T00:00:00+05:30`
  );

  const end = new Date(
    `${indiaDate}T23:59:59.999+05:30`
  );

  return {
    start,
    end,
  };
};

// ==========================================
// GET DASHBOARD STATISTICS
// ==========================================

const getDashboardStats = async (req, res) => {
  try {
    console.log(
      "================================="
    );

    console.log(
      "DASHBOARD CONTROLLER CALLED"
    );

    console.log(
      "================================="
    );

    const {
      start,
      end,
    } = getTodayRange();

    console.log(
      "TODAY START:",
      start
    );

    console.log(
      "TODAY END:",
      end
    );

    // ======================================
    // TOTAL ORDERS
    // ======================================

    const totalOrders =
      await Order.countDocuments();

    // ======================================
    // TODAY'S ORDERS
    // ======================================

    const todayOrders =
      await Order.countDocuments({
        createdAt: {
          $gte: start,
          $lte: end,
        },
      });

    // ======================================
    // TODAY'S STATUS COUNTS
    // ======================================

    const [
      pendingOrders,
      confirmedOrders,
      preparingOrders,
      readyOrders,
      completedOrders,
      cancelledOrders,
    ] = await Promise.all([
      Order.countDocuments({
        createdAt: {
          $gte: start,
          $lte: end,
        },
        orderStatus: "pending",
      }),

      Order.countDocuments({
        createdAt: {
          $gte: start,
          $lte: end,
        },
        orderStatus: "confirmed",
      }),

      Order.countDocuments({
        createdAt: {
          $gte: start,
          $lte: end,
        },
        orderStatus: "preparing",
      }),

      Order.countDocuments({
        createdAt: {
          $gte: start,
          $lte: end,
        },
        orderStatus: "ready",
      }),

      Order.countDocuments({
        createdAt: {
          $gte: start,
          $lte: end,
        },
        orderStatus: "completed",
      }),

      Order.countDocuments({
        createdAt: {
          $gte: start,
          $lte: end,
        },
        orderStatus: "cancelled",
      }),
    ]);

    // ======================================
    // TODAY'S PAID ORDERS
    // ======================================

    const paidOrders =
      await Order.countDocuments({
        createdAt: {
          $gte: start,
          $lte: end,
        },
        paymentStatus: "paid",
      });

    // ======================================
    // TODAY'S SALES
    // ======================================

    const salesResult =
      await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: start,
              $lte: end,
            },

            paymentStatus: "paid",

            orderStatus: {
              $ne: "cancelled",
            },
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: "$totalAmount",
            },
          },
        },
      ]);

    const todaySales =
      salesResult.length > 0
        ? salesResult[0].total
        : 0;

    // ======================================
    // TOTAL CUSTOMERS
    // ======================================

    let totalCustomers = 0;

    try {
      totalCustomers =
        await User.countDocuments({
          role: "customer",
        });
    } catch (error) {
      console.log(
        "USER CUSTOMER COUNT ERROR:",
        error.message
      );

      const customerPhones =
        await Order.distinct(
          "customerPhone"
        );

      totalCustomers =
        customerPhones.length;
    }

    // ======================================
    // FINAL RESPONSE
    // ======================================

    const stats = {
      totalOrders,
      todayOrders,

      pendingOrders,
      confirmedOrders,
      preparingOrders,
      readyOrders,
      completedOrders,
      cancelledOrders,

      paidOrders,

      totalCustomers,

      todaySales,
    };

    console.log(
      "DASHBOARD STATS:",
      stats
    );

    return res.status(200).json({
      success: true,
      stats,
    });

  } catch (error) {

    console.error(
      "DASHBOARD CONTROLLER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to load dashboard statistics",

      error: error.message,
    });
  }
};

// ==========================================
// SALES OVERVIEW
// ==========================================

const getSalesOverview = async (
  req,
  res
) => {
  try {

    const sales = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",

          orderStatus: {
            $ne: "cancelled",
          },
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",

              date: "$createdAt",

              timezone:
                "Asia/Kolkata",
            },
          },

          sales: {
            $sum: "$totalAmount",
          },

          orders: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      sales,
    });

  } catch (error) {

    console.error(
      "SALES OVERVIEW ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to load sales overview",

      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getSalesOverview,
};