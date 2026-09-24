import { useEffect, useState } from "react";
import api from "../../services/api";

const Payments = () => {
  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const fetchPayments =
    async () => {
      try {
        setLoading(true);

        const response =
          await api.get(
            "/reports/payments"
          );

        if (
          response.data.success
        ) {
          setOrders(
            response.data.orders ||
              []
          );
        }
      } catch (error) {
        console.error(
          "PAYMENTS ERROR:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div className="admin-content">

      <header className="admin-header">
        <div>
          <p className="eyebrow">
            PAYMENTS
          </p>

          <h1>Payments</h1>
        </div>
      </header>

      <section className="welcome-panel">

        <div
          style={{
            width: "100%",
            overflowX: "auto",
          }}
        >

          {loading ? (
            <p>
              Loading payments...
            </p>
          ) : orders.length === 0 ? (
            <p>
              No payments found.
            </p>
          ) : (
            <table
              style={{
                width: "100%",
              }}
            >
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment ID</th>
                </tr>
              </thead>

              <tbody>
                {orders.map(
                  (order) => (
                    <tr
                      key={
                        order._id
                      }
                    >
                      <td>
                        {
                          order.orderNumber
                        }
                      </td>

                      <td>
                        {
                          order.customerName
                        }
                      </td>

                      <td>
                        {
                          order.customerPhone
                        }
                      </td>

                      <td>
                        ₹
                        {Number(
                          order.totalAmount
                        ).toFixed(2)}
                      </td>

                      <td>
                        {
                          order.paymentStatus
                        }
                      </td>

                      <td>
                        {order
                          .razorpayPaymentId ||
                          "-"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}

        </div>

      </section>

    </div>
  );
};

export default Payments;