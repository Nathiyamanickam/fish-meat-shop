import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  User,
  Phone,
  ShoppingBag,
  ChevronRight,
  MapPin,
  Store,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

import api from "../../services/api";
import "./Checkout.css";

function Checkout() {
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
  });

  /* =========================================
     LOAD CART
  ========================================= */

  useEffect(() => {
    const savedCart = localStorage.getItem("fishShopCart");

    if (!savedCart) {
      setCart([]);
      return;
    }

    try {
      const parsedCart = JSON.parse(savedCart);

      if (Array.isArray(parsedCart)) {
        setCart(parsedCart);
      } else {
        setCart([]);
      }
    } catch (err) {
      console.error("Cart loading error:", err);
      setCart([]);
    }
  }, []);

  /* =========================================
     SUBTOTAL
  ========================================= */

  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const price = Number(item.unitPrice) || 0;
      const quantity = Number(item.quantity) || 0;

      return total + price * quantity;
    }, 0);
  }, [cart]);

  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  /* =========================================
     FORM CHANGE
  ========================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const onlyNumbers = value.replace(/\D/g, "");

      setForm((previous) => ({
        ...previous,
        phone: onlyNumbers.slice(0, 10),
      }));
    } else {
      setForm((previous) => ({
        ...previous,
        [name]: value,
      }));
    }

    setError("");
  };

  /* =========================================
     PLACE ORDER
  ========================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const customerName = form.name.trim();
    const customerPhone = form.phone.trim();

    if (!customerName) {
      setError("Please enter your full name.");
      return;
    }

    if (!customerPhone) {
      setError("Please enter your phone number.");
      return;
    }

    if (!/^[0-9]{10}$/.test(customerPhone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!cart.length) {
      setError("Your cart is empty.");
      return;
    }

    if (total <= 0) {
      setError(
        "Order amount is ₹0. Please check the product price in your cart."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/orders", {
        customerName,
        customerPhone,

        fulfillmentMethod: "pickup",

        deliveryAddress: "",
        city: "",

        items: cart.map((item) => ({
          dailyProductId: item.dailyProductId,
          quantity: Number(item.quantity),
          unit: item.unit,
        })),
      });

      console.log("CREATE ORDER RESPONSE:", response.data);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Order creation failed"
        );
      }

      /*
        Clear cart only after successful order.
      */
      localStorage.removeItem("fishShopCart");

      /*
        Go to My Orders.
      */
      navigate("/my-orders", {
        replace: true,
      });
    } catch (err) {
      console.error("ORDER CREATION ERROR:", err);
      console.error("SERVER RESPONSE:", err.response?.data);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to create your order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     EMPTY CART
  ========================================= */

  if (!cart.length) {
    return (
      <div className="fresh-checkout-page">
        <div className="fresh-checkout-empty">
          <div className="fresh-checkout-empty-icon">
            <ShoppingBag size={42} />
          </div>

          <h2>Your cart is empty</h2>

          <p>
            Add some fresh products before continuing
            to checkout.
          </p>

          <button
            type="button"
            className="fresh-checkout-main-button"
            onClick={() => navigate("/products")}
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fresh-checkout-page">
      <div className="fresh-checkout-container">

        {/* =====================================
            TOP BAR
        ===================================== */}

        <div className="fresh-checkout-topbar">
          <button
            type="button"
            className="fresh-back-button"
            onClick={() => navigate("/cart")}
          >
            <ArrowLeft size={18} />
            <span>Back to Cart</span>
          </button>

          <div className="fresh-secure-badge">
            <ShieldCheck size={18} />
            <span>Secure Checkout</span>
          </div>
        </div>

        {/* =====================================
            HEADER
        ===================================== */}

        <header className="fresh-checkout-heading">
          <span>FRESHCUT</span>

          <h1>Complete Your Order</h1>

          <p>
            Confirm your details and place your order.
          </p>
        </header>

        {/* =====================================
            MAIN
        ===================================== */}

        <div className="fresh-checkout-layout">

          {/* ===================================
              LEFT SIDE
          =================================== */}

          <div className="fresh-checkout-left">

            <form onSubmit={handleSubmit}>

              {/* CUSTOMER DETAILS */}

              <section className="fresh-checkout-card">

                <div className="fresh-section-heading">

                  <div className="fresh-section-icon">
                    <User size={21} />
                  </div>

                  <div>
                    <h2>Customer Details</h2>

                    <p>
                      Enter your contact information.
                    </p>
                  </div>

                </div>

                {error && (
                  <div className="fresh-checkout-error">
                    {error}
                  </div>
                )}

                {/* FULL NAME */}

                <div className="fresh-field">

                  <label htmlFor="customer-name">
                    Full Name <span>*</span>
                  </label>

                  <div className="fresh-input-container">

                    <User
                      className="fresh-input-icon"
                      size={19}
                    />

                    <input
                      id="customer-name"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      autoComplete="name"
                    />

                  </div>

                </div>

                {/* PHONE */}

                <div className="fresh-field">

                  <label htmlFor="customer-phone">
                    Phone Number <span>*</span>
                  </label>

                  <div className="fresh-input-container">

                    <Phone
                      className="fresh-input-icon"
                      size={19}
                    />

                    <input
                      id="customer-phone"
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Enter 10-digit phone number"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={10}
                    />

                  </div>

                  <small>
                    Enter your 10-digit mobile number.
                  </small>

                </div>

              </section>

              {/* ORDER COLLECTION */}

              <section className="fresh-checkout-card fresh-pickup-card">

                <div className="fresh-section-heading">

                  <div className="fresh-section-icon">
                    <Store size={21} />
                  </div>

                  <div>
                    <h2>Order Collection</h2>

                    <p>
                      Your order will be collected from our shop.
                    </p>
                  </div>

                </div>

                <div className="fresh-pickup-option">

                  <div className="fresh-pickup-icon">
                    <MapPin size={22} />
                  </div>

                  <div className="fresh-pickup-content">

                    <strong>Shop Pickup</strong>

                    <span>
                      Your order will be prepared and
                      kept ready for collection at the shop.
                    </span>

                  </div>

                  <div className="fresh-selected-check">
                    ✓
                  </div>

                </div>

                <div className="fresh-location-note">

                  <strong>Delivery by location</strong>

                  <p>
                    Home delivery based on your location
                    will be added in the next phase.
                  </p>

                </div>

              </section>

              {/* PLACE ORDER */}

              <button
                type="submit"
                className="fresh-place-order-button"
                disabled={loading}
              >
                {loading ? (
                  <span>Creating Order...</span>
                ) : (
                  <>
                    <span>Place Order</span>
                    <ChevronRight size={20} />
                  </>
                )}
              </button>

            </form>

          </div>

          {/* ===================================
              RIGHT SIDE
          =================================== */}

          <aside className="fresh-order-summary">

            <div className="fresh-summary-header">

              <div>
                <span>YOUR CART</span>

                <h2>Order Summary</h2>
              </div>

              <div className="fresh-item-count">
                {cart.length}{" "}
                {cart.length === 1 ? "item" : "items"}
              </div>

            </div>

            {/* ITEMS */}

            <div className="fresh-summary-items">

              {cart.map((item, index) => {

                const itemPrice =
                  Number(item.unitPrice) || 0;

                const quantity =
                  Number(item.quantity) || 0;

                const itemTotal =
                  itemPrice * quantity;

                const rateQuantity =
                  Number(item.rateQuantity) || 1;

                const unit =
                  item.unit || "piece";

                let quantityText;

                if (unit === "piece") {
                  quantityText = `${quantity} ${
                    quantity === 1
                      ? "piece"
                      : "pieces"
                  }`;
                } else {
                  const totalAmount =
                    rateQuantity * quantity;

                  quantityText =
                    `${quantity} × ${rateQuantity}${unit} = ${totalAmount}${unit}`;
                }

                return (
                  <div
                    className="fresh-summary-product"
                    key={
                      item.dailyProductId || index
                    }
                  >

                    {/* IMAGE */}

                    <div className="fresh-summary-image">

                      {item.image ? (
                        <img
                          src={item.image}
                          alt={
                            item.variety ||
                            item.name ||
                            "Product"
                          }
                        />
                      ) : (
                        <ShoppingBag size={27} />
                      )}

                    </div>

                    {/* DETAILS */}

                    <div className="fresh-summary-info">

                      <h3>
                        {item.variety ||
                          item.name ||
                          "Product"}
                      </h3>

                      <p>
                        {quantityText}
                      </p>

                      <span>
                        {item.rate ||
                          `₹${itemPrice}`}
                      </span>

                    </div>

                    {/* TOTAL */}

                    <strong>
                      ₹{itemTotal.toFixed(2)}
                    </strong>

                  </div>
                );
              })}

            </div>

            {/* PRICE */}

            <div className="fresh-summary-divider" />

            <div className="fresh-price-row">
              <span>Subtotal</span>

              <strong>
                ₹{subtotal.toFixed(2)}
              </strong>
            </div>

            <div className="fresh-price-row">
              <span>Shop Pickup</span>

              <strong className="fresh-free">
                FREE
              </strong>
            </div>

            <div className="fresh-summary-divider" />

            <div className="fresh-total-row">
              <span>Total</span>

              <strong>
                ₹{total.toFixed(2)}
              </strong>
            </div>

            {/* PAYMENT INFO */}

            <div className="fresh-payment-info">

              <ShieldCheck size={18} />

              <span>
                Payment will be completed in the
                next phase. For now, your order
                will be placed successfully.
              </span>

            </div>

          </aside>

        </div>

      </div>
    </div>
  );
}

export default Checkout;