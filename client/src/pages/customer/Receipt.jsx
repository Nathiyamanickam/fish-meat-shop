import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "qrcode";

import api from "../../services/api";

import "./Receipt.css";

const Receipt = () => {
  const { orderId } =
    useParams();

  const navigate =
    useNavigate();

  const receiptRef =
    useRef(null);

  const [order, setOrder] =
    useState(null);

  const [qrCode, setQrCode] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [downloading, setDownloading] =
    useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder =
    async () => {
      try {
        setLoading(true);

        const response =
          await api.get(
            `/orders/${orderId}`
          );

        if (
          response.data.success
        ) {
          const data =
            response.data.order;

          setOrder(data);

          const qrData =
            data.orderNumber;

          const qr =
            await QRCode.toDataURL(
              qrData,
              {
                width: 180,
                margin: 1,
              }
            );

          setQrCode(qr);
        }
      } catch (error) {
        console.error(
          "RECEIPT ERROR:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  const downloadPDF =
    async () => {
      try {
        setDownloading(true);

        const element =
          receiptRef.current;

        if (!element) {
          return;
        }

        const canvas =
          await html2canvas(
            element,
            {
              scale: 2,
              useCORS: true,
              backgroundColor:
                "#ffffff",
            }
          );

        const imageData =
          canvas.toDataURL(
            "image/png"
          );

        const pdf =
          new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
          });

        const pageWidth =
          pdf.internal.pageSize.getWidth();

        const pageHeight =
          pdf.internal.pageSize.getHeight();

        const margin = 15;

        const availableWidth =
          pageWidth -
          margin * 2;

        const imageHeight =
          (canvas.height *
            availableWidth) /
          canvas.width;

        const finalHeight =
          Math.min(
            imageHeight,
            pageHeight -
              margin * 2
          );

        pdf.addImage(
          imageData,
          "PNG",
          margin,
          margin,
          availableWidth,
          finalHeight
        );

        pdf.save(
          `Receipt-${order.orderNumber}.pdf`
        );
      } catch (error) {
        console.error(
          "PDF DOWNLOAD ERROR:",
          error
        );

        alert(
          "Failed to download receipt"
        );
      } finally {
        setDownloading(false);
      }
    };

  if (loading) {
    return (
      <div className="receipt-page">
        <p>
          Loading receipt...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="receipt-page">
        <h2>
          Receipt not found
        </h2>

        <button
          onClick={() =>
            navigate("/my-orders")
          }
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="receipt-page">

      <div
        className="receipt-actions"
      >
        <button
          onClick={() =>
            navigate("/my-orders")
          }
        >
          Back to Orders
        </button>

        <button
          className="download-receipt-btn"
          onClick={downloadPDF}
          disabled={downloading}
        >
          {downloading
            ? "Creating PDF..."
            : "Download Receipt"}
        </button>
      </div>

      <div
        ref={receiptRef}
        className="receipt-card"
      >

        <div className="receipt-header">

          <img
            src="/logo.png"
            alt="Meen Macchan"
            className="receipt-logo"
          />

          <h1>
            MEEN MACCHAN
          </h1>

          <p>
            Fish Fry & Chicken
          </p>

          <p>
            Soodu Soodu... Semma Suvai!
          </p>

        </div>

        <div className="receipt-divider" />

        <div className="receipt-info">

          <div>
            <span>
              Order Number
            </span>

            <strong>
              {order.orderNumber}
            </strong>
          </div>

          <div>
            <span>
              Date
            </span>

            <strong>
              {new Date(
                order.createdAt
              ).toLocaleDateString(
                "en-IN"
              )}
            </strong>
          </div>

          <div>
            <span>
              Customer
            </span>

            <strong>
              {order.customerName}
            </strong>
          </div>

          <div>
            <span>
              Phone
            </span>

            <strong>
              {order.customerPhone}
            </strong>
          </div>

        </div>

        <div className="receipt-divider" />

        <div className="receipt-items">

          {order.items.map(
            (item, index) => (
              <div
                className="receipt-item"
                key={index}
              >

                <div>
                  <strong>
                    {item.productName}
                  </strong>

                  {item.variety && (
                    <small>
                      {item.variety}
                    </small>
                  )}

                  <small>
                    Rate:{" "}
                    {item.rateText ||
                      `₹${item.unitPrice}`}
                  </small>
                </div>

                <div className="receipt-item-right">

                  <span>
                    {item.quantity} × ₹
                    {Number(
                      item.unitPrice
                    ).toFixed(2)}
                  </span>

                  <strong>
                    ₹
                    {Number(
                      item.totalPrice
                    ).toFixed(2)}
                  </strong>

                </div>

              </div>
            )
          )}

        </div>

        <div className="receipt-divider" />

        <div className="receipt-total">

          <span>
            Subtotal
          </span>

          <strong>
            ₹
            {Number(
              order.subtotal
            ).toFixed(2)}
          </strong>

        </div>

        <div className="receipt-total">

          <span>
            Delivery Fee
          </span>

          <strong>
            ₹
            {Number(
              order.deliveryFee || 0
            ).toFixed(2)}
          </strong>

        </div>

        <div className="receipt-grand-total">

          <span>
            TOTAL
          </span>

          <strong>
            ₹
            {Number(
              order.totalAmount
            ).toFixed(2)}
          </strong>

        </div>

        <div className="receipt-payment">

          <span>
            Payment Status
          </span>

          <strong>
            {order.paymentStatus}
          </strong>

        </div>

        {order.razorpayPaymentId && (
          <div className="payment-id">
            Payment ID:
            {" "}
            {order.razorpayPaymentId}
          </div>
        )}

        <div className="receipt-qr">

          {qrCode && (
            <img
              src={qrCode}
              alt="Order QR Code"
            />
          )}

          <p>
            Scan / show this QR
            for order identification
          </p>

          <strong>
            {order.orderNumber}
          </strong>

        </div>

        <div className="receipt-footer">

          <p>
            Thank you for ordering!
          </p>

          <p>
            Fresh Fish • Chicken
            • Meat
          </p>

        </div>

      </div>
    </div>
  );
};

export default Receipt;