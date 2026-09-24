const Review = require("../models/Review");
const Order = require("../models/Order");
const Product = require("../models/Product");

const createReview = async (
  req,
  res
) => {
  try {
    const {
      orderId,
      productId,
      rating,
      comment,
    } = req.body;

    if (
      !orderId ||
      !productId ||
      !rating
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Order, product and rating are required",
      });
    }

    const order =
      await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.customerPhone !==
      req.user.phone
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (
      order.orderStatus !==
      "completed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You can review only completed orders",
      });
    }

    const itemExists =
      order.items.some(
        (item) =>
          item.product.toString() ===
          productId
      );

    if (!itemExists) {
      return res.status(400).json({
        success: false,
        message:
          "This product was not part of the order",
      });
    }

    const product =
      await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const customer =
      order.customer;

    const review =
      await Review.create({
        customer,
        order: orderId,
        product: productId,
        rating: Number(rating),
        comment: comment || "",
      });

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    console.error(
      "Create review error:",
      error
    );

    if (
      error.code === 11000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You already reviewed this product for this order",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to submit review",
    });
  }
};

const getProductReviews = async (
  req,
  res
) => {
  try {
    const reviews =
      await Review.find({
        product: req.params.productId,
      })
        .populate(
          "customer",
          "name"
        )
        .sort({
          createdAt: -1,
        });

    const stats =
      await Review.aggregate([
        {
          $match: {
            product:
              require("mongoose").Types.ObjectId.createFromHexString(
                req.params.productId
              ),
          },
        },
        {
          $group: {
            _id: null,
            averageRating: {
              $avg: "$rating",
            },
            totalReviews: {
              $sum: 1,
            },
          },
        },
      ]);

    res.json({
      success: true,
      reviews,
      stats: {
        averageRating:
          stats[0]?.averageRating || 0,

        totalReviews:
          stats[0]?.totalReviews || 0,
      },
    });
  } catch (error) {
    console.error(
      "Get reviews error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load reviews",
    });
  }
};

const getMyReviews = async (
  req,
  res
) => {
  try {
    const reviews =
      await Review.find({
        customer: req.user._id,
      })
        .populate(
          "product",
          "name image"
        )
        .populate(
          "order",
          "orderNumber"
        )
        .sort({
          createdAt: -1,
        });

    res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error(
      "My reviews error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load reviews",
    });
  }
};

module.exports = {
  createReview,
  getProductReviews,
  getMyReviews,
};