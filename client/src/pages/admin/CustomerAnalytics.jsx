import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  UserCheck,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";

import api from "../../services/api";

const CustomerAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    orderingCustomers: 0,
    newCustomers: 0,
    repeatCustomers: 0,
  });

  const [loading, setLoading] = useState(false);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        "/customer-analytics"
      );

      if (response.data.success) {
        setAnalytics(
          response.data.analytics
        );
      }
    } catch (error) {
      console.error(
        "ANALYTICS ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="admin-content">

      <header className="admin-header">

        <div>
          <p className="eyebrow">
            CUSTOMER ANALYTICS
          </p>

          <h1>Customers</h1>
        </div>

        <button
          type="button"
          onClick={loadAnalytics}
          disabled={loading}
        >
          <RefreshCw size={16} />

          {loading
            ? "Loading..."
            : "Refresh"}
        </button>

      </header>

      <section className="stats-grid">

        <div className="stat-card">
          <Users size={22} />

          <span>
            Registered Customers
          </span>

          <strong>
            {analytics.totalCustomers}
          </strong>

          <small>
            Total customer accounts
          </small>
        </div>

        <div className="stat-card">
          <UserCheck size={22} />

          <span>
            Active Customers
          </span>

          <strong>
            {analytics.activeCustomers}
          </strong>

          <small>
            Ordered in last 30 days
          </small>
        </div>

        <div className="stat-card">
          <ShoppingBag size={22} />

          <span>
            Ordering Customers
          </span>

          <strong>
            {analytics.orderingCustomers}
          </strong>

          <small>
            Customers ordering today
          </small>
        </div>

        <div className="stat-card">
          <UserPlus size={22} />

          <span>
            New Customers
          </span>

          <strong>
            {analytics.newCustomers}
          </strong>

          <small>
            Registered in last 7 days
          </small>
        </div>

      </section>

      <section
        className="welcome-panel"
        style={{ marginTop: "24px" }}
      >

        <div>
          <p className="eyebrow">
            CUSTOMER RETENTION
          </p>

          <h2>
            Repeat Customers
          </h2>

          <p>
            Customers who have placed at least
            two orders.
          </p>
        </div>

        <strong
          style={{
            fontSize: "42px",
          }}
        >
          {analytics.repeatCustomers}
        </strong>

      </section>

    </div>
  );
};

export default CustomerAnalytics;