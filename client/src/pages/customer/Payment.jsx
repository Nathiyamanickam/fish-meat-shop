import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

import api from "../../services/api";
import "./Payment.css";

function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);

      const response = await api.get(`/orders/${orderId}`);

      setOrder(response.data.order);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Unable to load order."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);

      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setPaying(true);
      setError("");

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        setError(
          "Razorpay could not be loaded. Please check your internet connection."
        );

        setPaying(false);
        return;
      }

      // Create Razorpay order on backend
      const response = await api.post(
        "/orders/razorpay/create",
        {
          orderId: order._id,
        }
      );

      const razorpayOrder = response.data.razorpayOrder;

      const options = {
        key: response.data.key,

        amount: razorpayOrder.amount,

        currency: razorpayOrder.currency,

        name: "Fish & Meat Shop",

        description: `Payment for ${order.orderNumber}`,

        order_id: razorpayOrder.id,

        prefill: {
          name: order.customerName,
          contact: order.customerPhone,
        },

        notes: {
          orderNumber: order.orderNumber,
        },

        theme: {
          color: "#a84729",
        },

        handler: async function (paymentResponse) {
          try {
            setPaying(true);

            const verifyResponse = await api.post(
              "/orders/razorpay/verify",
              {
                orderId: order._id,

                razorpay_order_id:
                  paymentResponse.razorpay_order_id,

                razorpay_payment_id:
                  paymentResponse.razorpay_payment_id,

                razorpay_signature:
                  paymentResponse.razorpay_signature,
              }
            );

            if (verifyResponse.data.success) {
              localStorage.removeItem("fishShopCart");

              setSuccess(true);

              setTimeout(() => {
                navigate(`/orders/${order._id}`);
              }, 1800);
            }
          } catch (error) {
            console.error(error);

            setError(
              error.response?.data?.message ||
                "Payment verification failed."
            );
          } finally {
            setPaying(false);
          }
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        console.error("Payment failed:", response);

        setError(
          response.error?.description ||
            "Payment failed. Please try again."
        );

        setPaying(false);
      });

      razorpay.open();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Unable to start payment."
      );

      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="payment-page">
        <div className="payment-loading">
          Loading payment details...
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="payment-page">
        <div className="payment-success">
          <div className="success-icon">
            <CheckCircle size={50} />
          </div>

          <h1>Payment Successful</h1>

          <p>
            Your order <strong>{order?.orderNumber}</strong>{" "}
            has been paid successfully.
          </p>

          <span>Redirecting to your order...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="payment-page">
        <div className="payment-error-box">
          {error || "Order not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <button
          className="back-button"
          onClick={() => navigate("/checkout")}
        >
          <ArrowLeft size={18} />
          Back to Checkout
        </button>

        <div className="payment-header">
          <span>SECURE PAYMENT</span>

          <h1>Complete Payment</h1>

          <p>
            Your order is ready. Complete the payment securely
            using Razorpay.
          </p>
        </div>

        <div className="payment-card">
          <div className="payment-order-info">
            <div>
              <span>ORDER NUMBER</span>
              <strong>{order.orderNumber}</strong>
            </div>

            <div className="payment-pickup">
              <span>COLLECTION</span>
              <strong>Shop Pickup</strong>
            </div>
          </div>

          <div className="payment-divider" />

          <div className="payment-amount">
            <span>Total Amount</span>

            <strong>
              ₹{Number(order.totalAmount).toFixed(2)}
            </strong>
          </div>

          {error && (
            <div className="payment-error">
              {error}
            </div>
          )}

          <button
            className="pay-now-button"
            onClick={handlePayment}
            disabled={paying}
          >
            <CreditCard size={20} />

            {paying
              ? "Opening Secure Payment..."
              : `Pay ₹${Number(order.totalAmount).toFixed(2)}`}
          </button>

          <div className="secure-payment-note">
            <ShieldCheck size={17} />

            <span>
              Secure payment powered by Razorpay. Your payment
              details are processed securely.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;