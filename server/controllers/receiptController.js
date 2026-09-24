const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");

const Order = require("../models/Order");

const generateReceipt = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name phone")
      .populate("items.product", "name image");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const isAdmin =
      req.user?.role === "admin";

    const isCustomer =
      order.customerPhone === req.user?.phone;

    if (!isAdmin && !isCustomer) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const qrData = JSON.stringify({
      orderNumber: order.orderNumber,
      customerPhone: order.customerPhone,
      totalAmount: order.totalAmount,
    });

    const qrImage = await QRCode.toDataURL(
      qrData
    );

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${order.orderNumber}.pdf`
    );

    doc.pipe(res);

    doc
      .fontSize(24)
      .text("FreshCut", {
        align: "center",
      });

    doc
      .fontSize(12)
      .text("Fresh Fish & Meat Shop", {
        align: "center",
      });

    doc.moveDown();

    doc
      .fontSize(18)
      .text("ORDER RECEIPT", {
        align: "center",
      });

    doc.moveDown();

    doc
      .fontSize(12)
      .text(`Order Number: ${order.orderNumber}`);

    doc.text(
      `Customer: ${order.customerName}`
    );

    doc.text(
      `Phone: ${order.customerPhone}`
    );

    doc.text(
      `Payment: ${order.paymentStatus}`
    );

    doc.text(
      `Order Status: ${order.orderStatus}`
    );

    doc.moveDown();

    doc.fontSize(14).text("Items");

    doc.moveDown(0.5);

    order.items.forEach((item) => {
      doc
        .fontSize(11)
        .text(
          `${item.productName} - ${item.variety}`
        );

      doc.text(
        `Quantity: ${item.quantity} ${item.unit}`
      );

      doc.text(
        `Rate: ${item.rateText}`
      );

      doc.text(
        `Total: ₹${item.totalPrice}`
      );

      doc.moveDown(0.5);
    });

    doc.moveDown();

    doc
      .fontSize(12)
      .text(
        `Subtotal: ₹${order.subtotal}`
      );

    doc.text(
      `Delivery Fee: ₹${order.deliveryFee}`
    );

    doc
      .fontSize(16)
      .text(
        `Total: ₹${order.totalAmount}`
      );

    doc.moveDown();

    doc
      .fontSize(12)
      .text(
        "Show this QR code/order number when collecting your order."
      );

    doc.moveDown();

    const qrBuffer =
      Buffer.from(
        qrImage.split(",")[1],
        "base64"
      );

    doc.image(qrBuffer, {
      fit: [150, 150],
      align: "center",
    });

    doc.moveDown();

    doc
      .fontSize(10)
      .text(
        `Order Code: ${order.orderNumber}`,
        {
          align: "center",
        }
      );

    doc.end();
  } catch (error) {
    console.error(
      "Receipt error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to generate receipt",
    });
  }
};

module.exports = {
  generateReceipt,
};