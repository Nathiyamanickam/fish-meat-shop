import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Download,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../../services/api";
import socket from "../../services/socket";

import "./MyOrders.css";

const statuses = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
];

const statusLabels = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
};

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  preparing: Package,
  ready: Truck,
  completed: CheckCircle,
};

// ======================================================
// MY ORDERS
// ======================================================

const MyOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [notification, setNotification] =
    useState("");

  const [cancellingId, setCancellingId] =
    useState(null);

  // ====================================================
  // FETCH ORDERS
  // ====================================================

  const fetchOrders =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/orders/my-orders"
          );

        const fetchedOrders =
          response.data?.orders || [];

        // Extra frontend protection:
        // cancelled orders are not displayed.
        const activeOrders =
          fetchedOrders.filter(
            (order) =>
              order.orderStatus !==
              "cancelled"
          );

        setOrders(activeOrders);
      } catch (err) {
        console.error(
          "Fetch orders error:",
          err.response?.data ||
            err.message
        );

        setError(
          err.response?.data?.message ||
            "Failed to load your orders"
        );
      } finally {
        setLoading(false);
      }
    }, []);

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ====================================================
  // SOCKET
  // ====================================================

  useEffect(() => {
    const token =
      localStorage.getItem(
        "fishShopToken"
      );

    if (!token) {
      return;
    }

    socket.auth = {
      token,
    };

    const handleStatusUpdate = (
      data
    ) => {
      console.log(
        "CUSTOMER ORDER UPDATE:",
        data
      );

      // If order becomes cancelled,
      // remove it immediately.
      if (
        data?.orderStatus ===
        "cancelled"
      ) {
        setOrders(
          (previousOrders) =>
            previousOrders.filter(
              (order) =>
                String(order._id) !==
                String(data.orderId)
            )
        );

        setNotification(
          `Order ${data.orderNumber} was cancelled.`
        );

        return;
      }

      setOrders(
        (previousOrders) =>
          previousOrders.map(
            (order) =>
              String(order._id) ===
              String(data.orderId)
                ? {
                    ...order,
                    orderStatus:
                      data.orderStatus,
                    paymentStatus:
                      data.paymentStatus,
                    updatedAt:
                      data.updatedAt,
                  }
                : order
          )
      );

      setNotification(
        `Order ${data.orderNumber} is now ${statusLabels[
          data.orderStatus
        ] || data.orderStatus}.`
      );
    };

    socket.on(
      "order_status_updated",
      handleStatusUpdate
    );

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off(
        "order_status_updated",
        handleStatusUpdate
      );
    };
  }, []);

  // ====================================================
  // CLEAR NOTIFICATION
  // ====================================================

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timer =
      setTimeout(() => {
        setNotification("");
      }, 5000);

    return () =>
      clearTimeout(timer);
  }, [notification]);

  // ====================================================
  // CANCEL ORDER
  // ====================================================

  const cancelOrder = async (
    order
  ) => {
    // Frontend rule:
    // customer can ONLY cancel pending order
    if (
      order.orderStatus !==
      "pending"
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Cancel order ${order.orderNumber}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(order._id);

      await api.put(
        `/orders/${order._id}/cancel`
      );

      // Immediately remove from My Orders
      setOrders(
        (previousOrders) =>
          previousOrders.filter(
            (item) =>
              item._id !== order._id
          )
      );

      setNotification(
        `Order ${order.orderNumber} cancelled successfully.`
      );
    } catch (err) {
      console.error(
        "Cancel order error:",
        err.response?.data ||
          err.message
      );

      alert(
        err.response?.data?.message ||
          "Unable to cancel order"
      );

      await fetchOrders();
    } finally {
      setCancellingId(null);
    }
  };

  // ====================================================
  // RECEIPT
  // ====================================================

  const downloadReceipt =
    async (orderId) => {
      try {
        const response =
          await api.get(
            `/receipts/${orderId}`,
            {
              responseType: "blob",
            }
          );

        const blob =
          new Blob(
            [response.data],
            {
              type: "application/pdf",
            }
          );

        const url =
          window.URL.createObjectURL(
            blob
          );

        const link =
          document.createElement("a");

        link.href = url;

        link.download =
          "FreshCut-Order-Receipt.pdf";

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();

        window.URL.revokeObjectURL(
          url
        );
      } catch (err) {
        console.error(
          "Receipt error:",
          err
        );

        alert(
          "Unable to download receipt"
        );
      }
    };

  // ====================================================
  // FORMAT DATE
  // ====================================================

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "";
    }

    return new Date(
      value
    ).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ====================================================
  // FORMAT PRICE
  // ====================================================

  const money = (value) =>
    `₹${Number(value || 0).toFixed(
      2
    )}`;

  // ====================================================
  // RATE DISPLAY
  // ====================================================

  const getItemRateLabel = (
    item
  ) => {
    if (item.rateText) {
      return item.rateText;
    }

    if (
      item.rateQuantity &&
      item.unit
    ) {
      return `${money(
        item.unitPrice
      )}/${item.rateQuantity}${
        item.unit
      }`;
    }

    return money(
      item.unitPrice
    );
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div className="my-orders-page">
        <div className="my-orders-loading">
          <div className="my-orders-spinner" />

          <h2>
            Loading your orders...
          </h2>
        </div>
      </div>
    );
  }

  // ====================================================
  // PAGE
  // ====================================================

  return (
    <div className="my-orders-page">
      {/* HEADER */}

      <header className="my-orders-header">
        <button
          className="my-orders-back"
          onClick={() =>
            navigate(
              "/customer-home"
            )
          }
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div>
          <span className="my-orders-eyebrow">
            YOUR PURCHASES
          </span>

          <h1>
            My Orders
          </h1>

          <p>
            Track your fresh fish,
            chicken and meat orders.
          </p>
        </div>

        <button
          className="my-orders-refresh"
          onClick={fetchOrders}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      {/* NOTIFICATION */}

      {notification && (
        <div className="customer-notification">
          <CheckCircle size={18} />

          <span>
            {notification}
          </span>
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="my-orders-error">
          <strong>
            Unable to load orders
          </strong>

          <p>{error}</p>

          <button
            onClick={fetchOrders}
          >
            Try Again
          </button>
        </div>
      )}

      {/* EMPTY */}

      {!error &&
        orders.length === 0 && (
          <div className="my-orders-empty">
            <div className="empty-icon">
              <ShoppingBag
                size={38}
              />
            </div>

            <h2>
              No active orders
            </h2>

            <p>
              Your current orders
              will appear here.
            </p>

            <button
              onClick={() =>
                navigate(
                  "/products"
                )
              }
            >
              Browse Today's Products
            </button>
          </div>
        )}

      {/* ORDERS */}

      {orders.length > 0 && (
        <main className="customer-orders-list">
          {orders.map((order) => {
            const currentIndex =
              statuses.indexOf(
                order.orderStatus
              );

            const canCancel =
              order.orderStatus ===
              "pending";

            return (
              <article
                className="customer-order-card"
                key={order._id}
              >
                {/* TOP */}

                <div className="customer-order-top">
                  <div>
                    <span className="order-small-label">
                      ORDER NUMBER
                    </span>

                    <h2>
                      {order.orderNumber}
                    </h2>

                    <small>
                      {formatDate(
                        order.createdAt
                      )}
                    </small>
                  </div>

                  <div className="customer-order-total">
                    {money(
                      order.totalAmount
                    )}
                  </div>
                </div>

                {/* STATUS */}

                <div className="order-status-section">
                  <div className="order-status-title">
                    <span>
                      Order Status
                    </span>

                    <strong
                      className={`status-${order.orderStatus}`}
                    >
                      {order.orderStatus ===
                      "pending"
                        ? "Order Placed"
                        : statusLabels[
                            order.orderStatus
                          ] ||
                          order.orderStatus}
                    </strong>
                  </div>

                  {order.orderStatus !==
                    "cancelled" && (
                    <div className="order-progress">
                      {statuses.map(
                        (
                          status,
                          index
                        ) => {
                          const Icon =
                            statusIcons[
                              status
                            ];

                          const active =
                            index <=
                            currentIndex;

                          return (
                            <React.Fragment
                              key={
                                status
                              }
                            >
                              <div
                                className={`progress-step ${
                                  active
                                    ? "active"
                                    : ""
                                }`}
                              >
                                <div className="progress-icon">
                                  <Icon
                                    size={
                                      15
                                    }
                                  />
                                </div>

                                <span>
                                  {
                                    statusLabels[
                                      status
                                    ]
                                  }
                                </span>
                              </div>

                              {index <
                                statuses.length -
                                  1 && (
                                <div
                                  className={`progress-line ${
                                    index <
                                    currentIndex
                                      ? "active"
                                      : ""
                                  }`}
                                />
                              )}
                            </React.Fragment>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>

                {/* PAYMENT */}

                <div className="order-info-row">
                  <div>
                    <span>
                      Payment
                    </span>

                    <strong
                      className={
                        order.paymentStatus ===
                        "paid"
                          ? "payment-paid"
                          : "payment-pending"
                      }
                    >
                      {order.paymentStatus ===
                      "paid"
                        ? "Paid"
                        : "Pending"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Method
                    </span>

                    <strong>
                      {order.paymentMethod ||
                        "Razorpay"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Fulfillment
                    </span>

                    <strong>
                      {order.fulfillmentMethod ===
                      "delivery"
                        ? "Delivery"
                        : "Pickup"}
                    </strong>
                  </div>
                </div>

                {/* ITEMS */}

                <div className="order-items-section">
                  <div className="section-heading">
                    <span>
                      Order Items
                    </span>

                    <strong>
                      {order.items?.length ||
                        0}{" "}
                      item
                      {order.items?.length ===
                      1
                        ? ""
                        : "s"}
                    </strong>
                  </div>

                  <div className="customer-order-items">
                    {order.items?.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          className="customer-order-item"
                          key={`${order._id}-${index}`}
                        >
                          {/* IMAGE */}

                          <div className="customer-item-image">
                            {item.image ? (
                              <img
                                src={
                                  item.image
                                }
                                alt={
                                  item.variety ||
                                  item.productName
                                }
                                onError={(
                                  e
                                ) => {
                                  e.currentTarget.style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <Package
                                size={
                                  25
                                }
                              />
                            )}
                          </div>

                          {/* DETAILS */}

                          <div className="customer-item-details">
                            <strong>
                              {
                                item.productName
                              }
                            </strong>

                            {item.variety && (
                              <span>
                                {
                                  item.variety
                                }
                              </span>
                            )}

                            <small>
                              {item.quantity} ×{" "}
                              {item.rateQuantity ||
                                1}
                              {item.unit}
                            </small>
                          </div>

                          {/* PRICE */}

                          <div className="customer-item-price">
                            <span>
                              {getItemRateLabel(
                                item
                              )}
                            </span>

                            <strong>
                              {money(
                                item.totalPrice
                              )}
                            </strong>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* SUMMARY */}

                <div className="order-price-summary">
                  <div>
                    <span>
                      Subtotal
                    </span>

                    <strong>
                      {money(
                        order.subtotal
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Delivery Fee
                    </span>

                    <strong>
                      {money(
                        order.deliveryFee
                      )}
                    </strong>
                  </div>

                  <div className="grand-total">
                    <span>
                      Total
                    </span>

                    <strong>
                      {money(
                        order.totalAmount
                      )}
                    </strong>
                  </div>
                </div>

                {/* DELIVERY */}

                {order.fulfillmentMethod ===
                  "delivery" &&
                  order.deliveryAddress && (
                    <div className="delivery-details">
                      <span>
                        Delivery Address
                      </span>

                      <strong>
                        {
                          order.deliveryAddress
                        }
                      </strong>

                      {order.city && (
                        <small>
                          {order.city}
                        </small>
                      )}
                    </div>
                  )}

                {/* ACTIONS */}

                <div className="customer-order-actions">
                  <button
  onClick={() =>
    navigate(
      `/receipt/${order._id}`
    )
  }
>
  View Receipt
</button>

                  {/* ONLY PENDING */}

                  {canCancel && (
                    <button
                      className="cancel-order-button"
                      onClick={() =>
                        cancelOrder(
                          order
                        )
                      }
                      disabled={
                        cancellingId ===
                        order._id
                      }
                    >
                      <XCircle
                        size={17}
                      />

                      {cancellingId ===
                      order._id
                        ? "Cancelling..."
                        : "Cancel Order"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </main>
      )}
    </div>
  );
};

export default MyOrders;