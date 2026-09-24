import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  CreditCard,
  Users,
  LogOut,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    paidOrders: 0,
    totalCustomers: 0,
    todaySales: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH DASHBOARD STATISTICS
  // ==========================================

  const fetchDashboardStats = async () => {
    console.log("================================");
    console.log("DASHBOARD API CALL STARTED");
    console.log("================================");

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("fishShopToken");

      console.log("TOKEN EXISTS:", !!token);

      const response = await api.get("/dashboard/stats");

      console.log("DASHBOARD API RESPONSE:");
      console.log(response.data);

      if (response.data.success) {
        setStats(response.data.stats);
      } else {
        setError(
          response.data.message ||
            "Failed to load dashboard statistics"
        );
      }
    } catch (error) {
      console.error("DASHBOARD API ERROR:");
      console.error(error);

      console.error(
        "SERVER RESPONSE:",
        error.response?.data
      );

      setError(
        error.response?.data?.message ||
          "Failed to load dashboard statistics"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD DASHBOARD WHEN PAGE OPENS
  // ==========================================

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="admin-layout">

      {/* ==========================================
          SIDEBAR
      ========================================== */}

      <aside className="sidebar">

        {/* LOGO */}

       <div className="sidebar-logo">
  <img src="/logo.png" alt="Meen Macchan" />
</div>

        {/* ADMIN PROFILE */}

        <div className="admin-profile">

          <div className="profile-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>

          <div>
            <strong>
              {user?.name || "Admin"}
            </strong>

            <small>
              Administrator
            </small>
          </div>

        </div>

        {/* SIDEBAR MENU */}

        <div className="sidebar-menu">

          {/* DASHBOARD */}

          <button
            className="active"
            onClick={() =>
              navigate("/admin")
            }
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          {/* DAILY PRODUCTS */}

          <button
            onClick={() =>
              navigate("/admin/daily-inventory")
            }
          >
            <Package size={18} />
            Daily Products
          </button>

          {/* ORDERS */}

          <button
            onClick={() =>
              navigate("/admin/orders")
            }
          >
            <ShoppingBag size={18} />
            Orders
          </button>

          {/* PAYMENTS */}

          <button
  onClick={() =>
    navigate("/admin/payments")
  }
>
  <CreditCard size={18} />
  Payments
</button>

          {/* SALES */}

          <button onClick={() => navigate("/admin/sales")}>
  <TrendingUp size={18} />
  Sales & Income
</button>

          {/* CUSTOMERS */}

          <button onClick={() => navigate("/admin/customers")}>
  <Users size={18} />
  Customers
</button>

        </div>

        {/* LOGOUT */}

        <button
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          Logout
        </button>

      </aside>

      {/* ==========================================
          MAIN CONTENT
      ========================================== */}

      <main className="admin-content">

        {/* ==========================================
            HEADER
        ========================================== */}

        <header className="admin-header">

          <div>

            <p className="eyebrow">
              OVERVIEW
            </p>

            <h1>
              Dashboard
            </h1>

          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >

            {/* REFRESH BUTTON */}

            <button
              type="button"
              onClick={fetchDashboardStats}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #ddd",
                background: "#fff",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >

              <RefreshCw
                size={16}
                className={
                  loading
                    ? "admin-spin"
                    : ""
                }
              />

              {loading
                ? "Loading..."
                : "Refresh"}

            </button>

            {/* DATE BADGE */}

            <div className="date-badge">
              Today's Business
            </div>

          </div>

        </header>

        {/* ==========================================
            ERROR MESSAGE
        ========================================== */}

        {error && (
          <div
            style={{
              marginBottom: "20px",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "#fff1f0",
              color: "#c0392b",
              border: "1px solid #f3b5ae",
            }}
          >
            {error}
          </div>
        )}

        {/* ==========================================
            STATISTICS CARDS
        ========================================== */}

        <section className="stats-grid">

          {/* TODAY'S ORDERS */}

          <div className="stat-card">

            <span>
              Today's Orders
            </span>

            <strong>
              {loading
                ? "..."
                : stats.todayOrders}
            </strong>

            <small>
              {stats.todayOrders === 1
                ? "1 order received today"
                : `${stats.todayOrders} orders received today`}
            </small>

          </div>

          {/* TODAY'S SALES */}

          <div className="stat-card">

            <span>
              Today's Sales
            </span>

            <strong>
              {loading
                ? "..."
                : `₹${Number(
                    stats.todaySales
                  ).toFixed(2)}`}
            </strong>

            <small>
              Paid orders only
            </small>

          </div>

          {/* PAYMENTS */}

          <div className="stat-card">

            <span>
              Payments
            </span>

            <strong>
              {loading
                ? "..."
                : stats.paidOrders}
            </strong>

            <small>
              Paid orders today
            </small>

          </div>

          {/* CUSTOMERS */}

          <div className="stat-card">

            <span>
              Customers
            </span>

            <strong>
              {loading
                ? "..."
                : stats.totalCustomers}
            </strong>

            <small>
              Registered customers
            </small>

          </div>

        </section>

        {/* ==========================================
            TOTAL ORDERS
        ========================================== */}

        <section
          className="welcome-panel"
          style={{
            marginTop: "24px",
          }}
        >

          <div>

            <p className="eyebrow">
              ORDERS
            </p>

            <h2>
              Total Orders: {stats.totalOrders}
            </h2>

            <p>
              All customer orders stored in the system.
            </p>

          </div>

          <button
            className="primary-button"
            onClick={() =>
              navigate("/admin/orders")
            }
          >
            <ShoppingBag size={18} />

            View Orders

          </button>

        </section>

        {/* ==========================================
            TODAY'S ORDER STATUS
        ========================================== */}

        <section
          className="welcome-panel"
          style={{
            marginTop: "24px",
          }}
        >

          <div>

            <p className="eyebrow">
              ORDER STATUS
            </p>

            <h2>
              Today's Order Summary
            </h2>

            <p>
              Monitor customer orders by their
              current status.
            </p>

          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(100px, 1fr))",
              gap: "15px",
              minWidth: "360px",
            }}
          >

            <div>
              <strong>
                {stats.pendingOrders}
              </strong>

              <small>
                Pending
              </small>
            </div>

            <div>
              <strong>
                {stats.confirmedOrders}
              </strong>

              <small>
                Confirmed
              </small>
            </div>

            <div>
              <strong>
                {stats.preparingOrders}
              </strong>

              <small>
                Preparing
              </small>
            </div>

            <div>
              <strong>
                {stats.readyOrders}
              </strong>

              <small>
                Ready
              </small>
            </div>

            <div>
              <strong>
                {stats.completedOrders}
              </strong>

              <small>
                Completed
              </small>
            </div>

            <div>
              <strong>
                {stats.cancelledOrders}
              </strong>

              <small>
                Cancelled
              </small>
            </div>

          </div>

        </section>

        {/* ==========================================
            DAILY PRODUCTS
        ========================================== */}

        <section
          className="welcome-panel"
          style={{
            marginTop: "24px",
          }}
        >

          <div>

            <p className="eyebrow">
              NEXT STEP
            </p>

            <h2>
              Manage today's fresh products
            </h2>

            <p>
              Add fish, chicken and meat
              products available for today.
            </p>

          </div>

          <button
            className="primary-button"
            onClick={() =>
              navigate(
                "/admin/daily-inventory"
              )
            }
          >

            <Package size={18} />

            Add Products

          </button>

        </section>

      </main>

    </div>
  );
};

export default AdminDashboard;