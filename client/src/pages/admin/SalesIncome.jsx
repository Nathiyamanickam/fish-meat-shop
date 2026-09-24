import { useEffect, useState } from "react";
import {
  RefreshCw,
  TrendingUp,
  CreditCard,
  Clock,
  XCircle,
  RotateCcw,
} from "lucide-react";

import api from "../../services/api";

const SalesIncome = () => {
  const [summary, setSummary] = useState({
    todaySales: 0,
    todayPaidOrders: 0,
    totalSales: 0,
    totalPaidOrders: 0,
    pendingPayments: 0,
    failedPayments: 0,
    refundedPayments: 0,
  });

  const [orders, setOrders] = useState([]);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [loading, setLoading] = useState(false);

  const loadSummary = async () => {
    try {
      setLoading(true);

      const response = await api.get("/reports/summary");

      if (response.data.success) {
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error("SUMMARY ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSales = async () => {
    if (!from || !to) {
      return;
    }

    try {
      setLoading(true);

      const response = await api.get(
        `/reports/sales?from=${from}&to=${to}`
      );

      if (response.data.success) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error("SALES ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <div className="admin-content">

      <div className="admin-header">
        <div>
          <p className="eyebrow">REPORTS</p>
          <h1>Sales & Income</h1>
        </div>

        <button
          type="button"
          onClick={loadSummary}
          disabled={loading}
        >
          <RefreshCw size={16} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <section className="stats-grid">

        <div className="stat-card">
          <span>Today's Sales</span>

          <strong>
            ₹{Number(summary.todaySales).toFixed(2)}
          </strong>

          <small>
            {summary.todayPaidOrders} paid orders today
          </small>
        </div>

        <div className="stat-card">
          <span>Total Sales</span>

          <strong>
            ₹{Number(summary.totalSales).toFixed(2)}
          </strong>

          <small>
            {summary.totalPaidOrders} paid orders
          </small>
        </div>

        <div className="stat-card">
          <span>Pending Payments</span>

          <strong>{summary.pendingPayments}</strong>

          <small>Awaiting payment</small>
        </div>

        <div className="stat-card">
          <span>Failed Payments</span>

          <strong>{summary.failedPayments}</strong>

          <small>Payment failures</small>
        </div>

      </section>

      <section className="welcome-panel">

        <div>
          <p className="eyebrow">DATE RANGE</p>

          <h2>Sales Report</h2>

          <p>
            View paid orders between selected dates.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />

          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />

          <button
            className="primary-button"
            onClick={loadSales}
          >
            Generate Report
          </button>
        </div>

      </section>

      <section className="welcome-panel">

        <div style={{ width: "100%" }}>

          <h2>Paid Orders</h2>

          {orders.length === 0 ? (
            <p>No sales report data.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>

              <table style={{ width: "100%" }}>

                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>

                  {orders.map((order) => (
                    <tr key={order._id}>

                      <td>
                        {order.orderNumber}
                      </td>

                      <td>
                        {order.customerName}
                      </td>

                      <td>
                        {order.customerPhone}
                      </td>

                      <td>
                        ₹{Number(order.totalAmount).toFixed(2)}
                      </td>

                      <td>
                        {order.paymentStatus}
                      </td>

                      <td>
                        {new Date(
                          order.createdAt
                        ).toLocaleDateString("en-IN")}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </section>

    </div>
  );
};

export default SalesIncome;