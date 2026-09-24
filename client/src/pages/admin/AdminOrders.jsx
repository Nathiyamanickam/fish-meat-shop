import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  X,
  ShoppingBag,
} from "lucide-react";

import api from "../../services/api";
import "./AdminOrders.css";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

const formatStatus = (status) => {
  if (!status) return "";

  return status
    .charAt(0)
    .toUpperCase() +
    status.slice(1);
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

function AdminOrders() {
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [updatingId, setUpdatingId] =
    useState(null);

  /* =====================================================
     FETCH ORDERS
  ===================================================== */

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/orders/admin/all",
        {
          params: {
            status: statusFilter,
            search: search.trim(),
          },
        }
      );

      console.log(
        "ADMIN ORDERS:",
        response.data
      );

      if (response.data?.success) {
        setOrders(
          Array.isArray(response.data.orders)
            ? response.data.orders
            : []
        );
      } else {
        setOrders([]);
        setError(
          response.data?.message ||
            "Failed to load orders"
        );
      }
    } catch (err) {
      console.error(
        "FETCH ADMIN ORDERS ERROR:",
        err
      );

      setOrders([]);

      setError(
        err.response?.data?.message ||
          "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  /* =====================================================
     SEARCH
  ===================================================== */

  const handleSearch = (e) => {
    e.preventDefault();

    fetchOrders();
  };

  /* =====================================================
     CHANGE ORDER STATUS
  ===================================================== */

 const handleStatusChange = async (
  orderId,
  newStatus
) => {
  if (!orderId || !newStatus) {
    return;
  }

  try {
    setUpdatingId(orderId);
    setError("");

    console.log(
      "UPDATING ORDER:",
      orderId
    );

    console.log(
      "NEW STATUS:",
      newStatus
    );

    const response = await api.put(
      `/orders/${orderId}/status`,
      {
        status: newStatus,
      }
    );

    console.log(
      "STATUS UPDATE RESPONSE:",
      response.data
    );

    if (!response.data?.success) {
      throw new Error(
        response.data?.message ||
          "Failed to update order status"
      );
    }

    const updatedOrder =
      response.data.order;

    // Update table
    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        order._id === orderId
          ? {
              ...order,
              orderStatus:
                updatedOrder?.orderStatus ||
                newStatus,
              updatedAt:
                updatedOrder?.updatedAt ||
                new Date().toISOString(),
            }
          : order
      )
    );

    // Update modal
    setSelectedOrder((previous) => {
      if (!previous) {
        return previous;
      }

      if (previous._id !== orderId) {
        return previous;
      }

      return {
        ...previous,
        orderStatus:
          updatedOrder?.orderStatus ||
          newStatus,
        updatedAt:
          updatedOrder?.updatedAt ||
          new Date().toISOString(),
      };
    });

  } catch (err) {
    console.error(
      "STATUS UPDATE ERROR:",
      err
    );

    setError(
      err.response?.data?.message ||
        err.message ||
        "Failed to update order status"
    );
  } finally {
    setUpdatingId(null);
  }
};

  /* =====================================================
     STATUS CLASS
  ===================================================== */

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "admin-status-pending";

      case "confirmed":
        return "admin-status-confirmed";

      case "preparing":
        return "admin-status-preparing";

      case "ready":
        return "admin-status-ready";

      case "completed":
        return "admin-status-completed";

      case "cancelled":
        return "admin-status-cancelled";

      default:
        return "";
    }
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="admin-orders-page">

      <div className="admin-orders-container">

        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="admin-orders-header">

          <div>
            <div className="admin-orders-eyebrow">
              ADMIN PANEL
            </div>

            <h1>Orders</h1>

            <p>
              View and manage customer orders.
            </p>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={fetchOrders}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "admin-spin"
                  : ""
              }
            />

            Refresh
          </button>

        </div>

        {/* ==========================================
            FILTERS
        ========================================== */}

        <div className="admin-orders-filters">

          <form
            className="admin-search-form"
            onSubmit={handleSearch}
          >
            <Search size={18} />

            <input
              type="text"
              placeholder="Search order, customer or phone..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <button type="submit">
              Search
            </button>
          </form>

          <select
            className="admin-status-filter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="all">
              All Orders
            </option>

            {STATUS_OPTIONS.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {formatStatus(status)}
                </option>
              )
            )}
          </select>

        </div>

        {/* ==========================================
            ERROR
        ========================================== */}

        {error && (
          <div className="admin-orders-error">
            {error}
          </div>
        )}

        {/* ==========================================
            TABLE
        ========================================== */}

        <div className="admin-orders-card">

          <div className="admin-orders-table-wrapper">

            <table className="admin-orders-table">

              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>CUSTOMER</th>
                  <th>ITEMS</th>
                  <th>TYPE</th>
                  <th>TOTAL</th>
                  <th>PAYMENT</th>
                  <th>STATUS</th>
                  <th>TIME</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="admin-table-loading"
                    >
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="admin-table-empty"
                    >
                      <ShoppingBag
                        size={36}
                      />

                      <strong>
                        No orders found
                      </strong>

                      <span>
                        Try changing your search
                        or filter.
                      </span>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (

                    <tr key={order._id}>

                      {/* ORDER */}

                      <td>
                        <div className="admin-order-number">
                          {order.orderNumber}
                        </div>
                      </td>

                      {/* CUSTOMER */}

                      <td>
                        <div className="admin-customer">
                          <strong>
                            {order.customerName ||
                              "Customer"}
                          </strong>

                          <span>
                            {order.customerPhone ||
                              "-"}
                          </span>
                        </div>
                      </td>

                      {/* ITEMS */}

                      <td>
                        <span className="admin-items-count">
                          {order.items?.length || 0}{" "}
                          {order.items?.length === 1
                            ? "item"
                            : "items"}
                        </span>
                      </td>

                      {/* TYPE */}

                      <td>
                        <span className="admin-type-badge">
                          {formatStatus(
                            order.fulfillmentMethod ||
                              "pickup"
                          )}
                        </span>
                      </td>

                      {/* TOTAL */}

                      <td>
                        <strong className="admin-total">
                          ₹
                          {Number(
                            order.totalAmount || 0
                          ).toFixed(2)}
                        </strong>
                      </td>

                      {/* PAYMENT */}

                      <td>
                        <span
                          className={`admin-payment-badge ${
                            order.paymentStatus ===
                            "paid"
                              ? "admin-payment-paid"
                              : "admin-payment-pending"
                          }`}
                        >
                          {formatStatus(
                            order.paymentStatus ||
                              "pending"
                          )}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td>

                        <select
                          className={`admin-order-status-select ${getStatusClass(
                            order.orderStatus
                          )}`}
                          value={
                            order.orderStatus ||
                            "pending"
                          }
                          disabled={
                            updatingId ===
                            order._id
                          }
                          onChange={(e) =>
                            handleStatusChange(
                              order._id,
                              e.target.value
                            )
                          }
                        >

                          {STATUS_OPTIONS.map(
                            (status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {formatStatus(
                                  status
                                )}
                              </option>
                            )
                          )}

                        </select>

                      </td>

                      {/* TIME */}

                      <td>
                        <span className="admin-order-time">
                          {formatDate(
                            order.createdAt
                          )}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td>
                        <button
                          type="button"
                          className="admin-view-button"
                          onClick={() =>
                            setSelectedOrder(
                              order
                            )
                          }
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>

                    </tr>

                  ))
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* ==========================================
          ORDER DETAILS MODAL
      ========================================== */}

      {selectedOrder && (

        <div
          className="admin-order-modal-overlay"
          onClick={() =>
            setSelectedOrder(null)
          }
        >

          <div
            className="admin-order-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="admin-modal-header">

              <div>
                <span>ORDER DETAILS</span>

                <h2>
                  {selectedOrder.orderNumber}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(null)
                }
              >
                <X size={20} />
              </button>

            </div>

            <div className="admin-modal-customer">

              <strong>
                {selectedOrder.customerName}
              </strong>

              <span>
                {selectedOrder.customerPhone}
              </span>

            </div>

            <div className="admin-modal-status-row">

              <label>
                Order Status
              </label>

              <select
                className={`admin-modal-status-select ${getStatusClass(
                  selectedOrder.orderStatus
                )}`}
                value={
                  selectedOrder.orderStatus ||
                  "pending"
                }
                disabled={
                  updatingId ===
                  selectedOrder._id
                }
                onChange={(e) =>
                  handleStatusChange(
                    selectedOrder._id,
                    e.target.value
                  )
                }
              >

                {STATUS_OPTIONS.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {formatStatus(status)}
                    </option>
                  )
                )}

              </select>

            </div>

            <div className="admin-modal-items">

              {selectedOrder.items?.map(
                (item, index) => (

                  <div
                    className="admin-modal-item"
                    key={index}
                  >

                    <div>
                      <strong>
                        {item.variety ||
                          item.productName}
                      </strong>

                      <span>
                        {item.quantity}{" "}
                        {item.unit}
                      </span>

                      <small>
                        {item.rateText}
                      </small>
                    </div>

                    <strong>
                      ₹
                      {Number(
                        item.totalPrice || 0
                      ).toFixed(2)}
                    </strong>

                  </div>

                )
              )}

            </div>

            <div className="admin-modal-total">

              <span>
                Total
              </span>

              <strong>
                ₹
                {Number(
                  selectedOrder.totalAmount ||
                    0
                ).toFixed(2)}
              </strong>

            </div>

            <div className="admin-modal-footer">

              <span>
                {formatDate(
                  selectedOrder.createdAt
                )}
              </span>

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default AdminOrders;