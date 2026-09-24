const User = require("../models/User");
const Order = require("../models/Order");

const getISTDateString = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(date);
};

const getISTStart = (dateString) => {
  return new Date(`${dateString}T00:00:00.000+05:30`);
};

const getCustomerAnalytics = async (req, res) => {
  try {
    const now = new Date();

    const todayString = getISTDateString(now);

    const todayStart = getISTStart(todayString);

    const thirtyDaysAgo = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    const sevenDaysAgo = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    const totalCustomers = await User.countDocuments({
      role: "customer",
    });

    const newCustomers = await User.countDocuments({
      role: "customer",
      createdAt: {
        $gte: sevenDaysAgo,
      },
    });

    const todayOrders = await Order.find({
      createdAt: {
        $gte: todayStart,
      },
    }).select("customer");

    const orderingCustomerIds = [
      ...new Set(
        todayOrders
          .map((order) => order.customer?.toString())
          .filter(Boolean)
      ),
    ];

    const orderingCustomers = orderingCustomerIds.length;

    const activeOrders = await Order.find({
      createdAt: {
        $gte: thirtyDaysAgo,
      },
    }).select("customer");

    const activeCustomerIds = [
      ...new Set(
        activeOrders
          .map((order) => order.customer?.toString())
          .filter(Boolean)
      ),
    ];

    const activeCustomers = activeCustomerIds.length;

    const repeatCustomersResult = await Order.aggregate([
      {
        $group: {
          _id: "$customer",
          orderCount: {
            $sum: 1,
          },
        },
      },
      {
        $match: {
          orderCount: {
            $gte: 2,
          },
        },
      },
      {
        $count: "repeatCustomers",
      },
    ]);

    const repeatCustomers =
      repeatCustomersResult[0]?.repeatCustomers || 0;

    res.json({
      success: true,
      analytics: {
        totalCustomers,
        activeCustomers,
        orderingCustomers,
        newCustomers,
        repeatCustomers,
      },
    });
  } catch (error) {
    console.error(
      "CUSTOMER ANALYTICS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load customer analytics",
    });
  }
};

module.exports = {
  getCustomerAnalytics,
};