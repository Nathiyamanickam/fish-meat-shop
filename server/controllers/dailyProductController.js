const mongoose = require("mongoose");
const DailyProduct = require("../models/DailyProduct");
const Product = require("../models/Product");

//
const cloudinary =
  require("../config/cloudinary");

const uploadDailyProductImage = async (
  req,
  res
) => {
  try {
    const dailyProduct =
      await DailyProduct.findById(
        req.params.id
      );

    if (!dailyProduct) {
      return res.status(404).json({
        success: false,
        message:
          "Daily product not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please select an image",
      });
    }

    const result = await new Promise(
      (resolve, reject) => {
        const stream =
          cloudinary.uploader.upload_stream(
            {
              folder:
                "fish-meat-shop/daily-products",

              resource_type: "image",
            },

            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

        stream.end(req.file.buffer);
      }
    );

    dailyProduct.image =
      result.secure_url;

    await dailyProduct.save();

    const updated =
      await DailyProduct.findById(
        dailyProduct._id
      ).populate("product");

    return res.status(200).json({
      success: true,

      message:
        "Daily product image uploaded successfully",

      dailyProduct: updated,
    });
  } catch (error) {
    console.error(
      "DAILY IMAGE UPLOAD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Image upload failed",
    });
  }
};
const parseRate = (rateText) => {
  const value = String(rateText || "")
    .trim()
    .replace(/^₹\s*/, "")
    .replace(/\s+/g, " ");

  if (!value) {
    return null;
  }

  // ------------------------------------------
  // 200/150g
  // 250/500g
  // 400/1kg
  // ------------------------------------------

  const quantityMatch = value.match(
    /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*(g|gm|gram|grams|kg)$/i
  );

  if (quantityMatch) {
    const price = Number(quantityMatch[1]);
    const rateQuantity = Number(quantityMatch[2]);
    const rateUnit = quantityMatch[3].toLowerCase();

    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(rateQuantity) ||
      rateQuantity <= 0
    ) {
      return null;
    }

    return {
      unitPrice: price,
      rateQuantity,
      unit: rateUnit === "kg" ? "kg" : "g",
    };
  }

  // ------------------------------------------
  // 400/kg
  // 50/g
  // 30/piece
  // ------------------------------------------

  const simpleMatch = value.match(
    /^(\d+(?:\.\d+)?)\s*\/\s*(piece|pieces|pcs|kg|g|gm|gram|grams)$/i
  );

  if (simpleMatch) {
    const price = Number(simpleMatch[1]);
    const rateUnit = simpleMatch[2].toLowerCase();

    let unit = "piece";

    if (rateUnit === "kg") {
      unit = "kg";
    } else if (
      ["g", "gm", "gram", "grams"].includes(rateUnit)
    ) {
      unit = "g";
    }

    return {
      unitPrice: price,
      rateQuantity: 1,
      unit,
    };
  }

  // ------------------------------------------
  // 100 per piece
  // 400 per kg
  // 50 per gram
  // ------------------------------------------

  const perMatch = value.match(
    /^(\d+(?:\.\d+)?)\s*per\s*(piece|pieces|pcs|kg|g|gm|gram|grams)$/i
  );

  if (perMatch) {
    const price = Number(perMatch[1]);
    const rateUnit = perMatch[2].toLowerCase();

    let unit = "piece";

    if (rateUnit === "kg") {
      unit = "kg";
    } else if (
      ["g", "gm", "gram", "grams"].includes(rateUnit)
    ) {
      unit = "g";
    }

    return {
      unitPrice: price,
      rateQuantity: 1,
      unit,
    };
  }

  return null;
};

// ======================================================
// BOOLEAN HELPER
// ======================================================

const convertBoolean = (
  value,
  defaultValue = true
) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const text = String(value).toLowerCase();

  if (text === "true") {
    return true;
  }

  if (text === "false") {
    return false;
  }

  return defaultValue;
};

// ======================================================
// CREATE DAILY PRODUCT
// ======================================================

const createDailyProduct = async (req, res) => {
  try {
    const {
      product,
      variety,
      date,
      rate,
      availableQuantity,
      stockQuantity,
      isAvailable,
    } = req.body;

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Product is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(product)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!date || !String(date).trim()) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    if (!variety || !String(variety).trim()) {
      return res.status(400).json({
        success: false,
        message: "Dish / variety is required",
      });
    }

    if (!rate || !String(rate).trim()) {
      return res.status(400).json({
        success: false,
        message: "Rate is required",
      });
    }

    if (
      !availableQuantity ||
      !String(availableQuantity).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Available quantity is required",
      });
    }

    const parsedRate = parseRate(rate);

    if (!parsedRate) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid rate. Examples: 200/150g, 400/kg, 30/piece",
      });
    }

    const stock = Number(stockQuantity);

    if (!Number.isFinite(stock) || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock quantity must be a valid number",
      });
    }

    const masterProduct =
      await Product.findById(product);

    if (!masterProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ------------------------------------------
    // DUPLICATE
    // ------------------------------------------

    const duplicate =
      await DailyProduct.findOne({
        product,
        date: String(date).trim(),
        variety: String(variety).trim(),
      });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message:
          "This dish / variety is already added for this date",
      });
    }

    const dailyProduct =
      await DailyProduct.create({
        product,
        variety: String(variety).trim(),
        date: String(date).trim(),
        rate: String(rate).trim(),

        unitPrice: parsedRate.unitPrice,
        rateQuantity: parsedRate.rateQuantity,
        unit: parsedRate.unit,

        // IMPORTANT:
        // image belongs to DailyProduct
        image: "",

        availableQuantity:
          String(availableQuantity).trim(),

        stockQuantity: stock,

        isAvailable: convertBoolean(
          isAvailable,
          true
        ),
      });

    const populated =
      await DailyProduct.findById(
        dailyProduct._id
      ).populate("product");

    return res.status(201).json({
      success: true,
      message:
        "Daily inventory added successfully",
      dailyProduct: populated,
    });
  } catch (error) {
    console.error(
      "Create daily product error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This dish / variety is already added for this date",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ======================================================
// GET DAILY PRODUCTS - ADMIN
// ======================================================

const getDailyProducts = async (req, res) => {
  try {
    const date = req.query.date;

    const filter = {};

    if (date) {
      filter.date = String(date).trim();
    }

    const dailyProducts =
      await DailyProduct.find(filter)
        .populate("product")
        .sort({
          date: -1,
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: dailyProducts.length,
      dailyProducts,
    });
  } catch (error) {
    console.error(
      "Get daily products error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load daily inventory",
    });
  }
};

// ======================================================
// GET SINGLE DAILY PRODUCT
// ======================================================

const getDailyProductById = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid daily product ID",
      });
    }

    const dailyProduct =
      await DailyProduct.findById(
        req.params.id
      ).populate("product");

    if (!dailyProduct) {
      return res.status(404).json({
        success: false,
        message: "Daily product not found",
      });
    }

    return res.status(200).json({
      success: true,
      dailyProduct,
    });
  } catch (error) {
    console.error(
      "Get daily product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================================================
// UPDATE DAILY PRODUCT
// ======================================================

const updateDailyProduct = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid daily product ID",
      });
    }

    const dailyProduct =
      await DailyProduct.findById(
        req.params.id
      );

    if (!dailyProduct) {
      return res.status(404).json({
        success: false,
        message: "Daily product not found",
      });
    }

    const {
      product,
      variety,
      date,
      rate,
      availableQuantity,
      stockQuantity,
      isAvailable,
    } = req.body;

    const updatedProduct =
      product !== undefined
        ? product
        : dailyProduct.product;

    const updatedVariety =
      variety !== undefined
        ? String(variety).trim()
        : dailyProduct.variety;

    const updatedDate =
      date !== undefined
        ? String(date).trim()
        : dailyProduct.date;

    const updatedRate =
      rate !== undefined
        ? String(rate).trim()
        : dailyProduct.rate;

    if (
      !mongoose.Types.ObjectId.isValid(
        updatedProduct
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!updatedVariety) {
      return res.status(400).json({
        success: false,
        message: "Dish / variety is required",
      });
    }

    if (!updatedDate) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const parsedRate = parseRate(updatedRate);

    if (!parsedRate) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid rate. Examples: 200/150g, 400/kg, 30/piece",
      });
    }

    let updatedQuantity =
      availableQuantity !== undefined
        ? String(availableQuantity).trim()
        : dailyProduct.availableQuantity;

    if (!updatedQuantity) {
      return res.status(400).json({
        success: false,
        message:
          "Available quantity is required",
      });
    }

    const updatedStock =
      stockQuantity !== undefined
        ? Number(stockQuantity)
        : Number(dailyProduct.stockQuantity);

    if (
      !Number.isFinite(updatedStock) ||
      updatedStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stock quantity must be a valid number",
      });
    }

    const duplicate =
      await DailyProduct.findOne({
        product: updatedProduct,
        date: updatedDate,
        variety: updatedVariety,
        _id: {
          $ne: dailyProduct._id,
        },
      });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message:
          "This dish / variety is already added for this date",
      });
    }

    dailyProduct.product =
      updatedProduct;

    dailyProduct.variety =
      updatedVariety;

    dailyProduct.date =
      updatedDate;

    dailyProduct.rate =
      updatedRate;

    dailyProduct.unitPrice =
      parsedRate.unitPrice;

    dailyProduct.rateQuantity =
      parsedRate.rateQuantity;

    dailyProduct.unit =
      parsedRate.unit;

    dailyProduct.availableQuantity =
      updatedQuantity;

    dailyProduct.stockQuantity =
      updatedStock;

    if (isAvailable !== undefined) {
      dailyProduct.isAvailable =
        convertBoolean(
          isAvailable,
          dailyProduct.isAvailable
        );
    }

    await dailyProduct.save();

    const updated =
      await DailyProduct.findById(
        dailyProduct._id
      ).populate("product");

    return res.status(200).json({
      success: true,
      message:
        "Daily inventory updated successfully",
      dailyProduct: updated,
    });
  } catch (error) {
    console.error(
      "Update daily product error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This dish / variety is already added for this date",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ======================================================
// DELETE
// ======================================================

const deleteDailyProduct = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid daily product ID",
      });
    }

    const dailyProduct =
      await DailyProduct.findById(
        req.params.id
      );

    if (!dailyProduct) {
      return res.status(404).json({
        success: false,
        message: "Daily product not found",
      });
    }

    await dailyProduct.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Daily inventory deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete daily product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================================================
// GET TODAY'S PRODUCTS - CUSTOMER
// ======================================================

const getTodayProducts = async (
  req,
  res
) => {
  try {
    // Server local date
    const now = new Date();

    const yyyy = now.getFullYear();

    const mm = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const dd = String(
      now.getDate()
    ).padStart(2, "0");

    const today =
      `${yyyy}-${mm}-${dd}`;

    const dailyProducts =
      await DailyProduct.find({
        date: today,
        isAvailable: true,
      })
        .populate({
          path: "product",
          match: {
            isActive: true,
          },
        })
        .sort({
          createdAt: -1,
        });

    const availableProducts =
      dailyProducts.filter(
        (item) => item.product !== null
      );

    return res.status(200).json({
      success: true,
      date: today,
      count: availableProducts.length,
      dailyProducts:
        availableProducts,
    });
  } catch (error) {
    console.error(
      "Get today's products error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load today's products",
    });
  }
};

module.exports = {
  createDailyProduct,
  getDailyProducts,
  getDailyProductById,
  updateDailyProduct,
  deleteDailyProduct,
  getTodayProducts,
  uploadDailyProductImage,
};