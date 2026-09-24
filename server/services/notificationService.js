const sendSMS = async ({
  phone,
  message,
}) => {
  try {
    console.log("SMS NOTIFICATION");

    console.log("Phone:", phone);

    console.log("Message:", message);

    /*
      Add your SMS provider API here.

      Example flow:

      await provider.sendSMS({
        phone,
        message,
      });
    */

    return {
      success: true,
      channel: "sms",
    };
  } catch (error) {
    console.error(
      "SMS error:",
      error.message
    );

    return {
      success: false,
      channel: "sms",
      error: error.message,
    };
  }
};

const sendWhatsApp = async ({
  phone,
  message,
}) => {
  try {
    console.log("WHATSAPP NOTIFICATION");

    console.log("Phone:", phone);

    console.log("Message:", message);

    /*
      Add your WhatsApp Business provider API here.
    */

    return {
      success: true,
      channel: "whatsapp",
    };
  } catch (error) {
    console.error(
      "WhatsApp error:",
      error.message
    );

    return {
      success: false,
      channel: "whatsapp",
      error: error.message,
    };
  }
};

const notifyOrderPlaced = async (
  order
) => {
  const message =
    `FreshCut Order ${order.orderNumber} ` +
    `placed successfully. ` +
    `Total: ₹${order.totalAmount}.`;

  await sendSMS({
    phone: order.customerPhone,
    message,
  });

  await sendWhatsApp({
    phone: order.customerPhone,
    message,
  });
};

const notifyOrderStatus = async (
  order
) => {
  const message =
    `FreshCut Order ${order.orderNumber} ` +
    `status updated to ${order.orderStatus}.`;

  await sendSMS({
    phone: order.customerPhone,
    message,
  });

  await sendWhatsApp({
    phone: order.customerPhone,
    message,
  });
};

module.exports = {
  sendSMS,
  sendWhatsApp,
  notifyOrderPlaced,
  notifyOrderStatus,
};