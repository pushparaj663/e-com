import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./PaymentSuccess.css";

export default function PaymentSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;

  if (!data) {
    return (
      <div className="payment-success-container">
        <h2>⚠️ No payment details found</h2>
        <button onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  // Safely format amounts
  const formatAmount = (amt) => {
    if (amt === undefined || amt === null) return "0.00";
    return Number(amt).toFixed(2);
  };

  return (
    <div className="payment-success-container">
      <div className="success-icon">✅</div>
      <h1>Payment Successful!</h1>

      <p className="thank-you">
        Thank you for your purchase{data.name ? `, ${data.name}` : ""}!
      </p>

      {/* ---------------- Payment Details ---------------- */}
      <div className="payment-details">
        <h3>Payment Details</h3>

        <div className="detail-item">
          <span>Payment ID:</span>
          <span>{data.paymentId || "N/A (COD/UPI)"}</span>
        </div>

        <div className="detail-item">
          <span>Status:</span>
          <span>{data.status || "succeeded"}</span>
        </div>

        <div className="detail-item">
          <span>Amount:</span>
          <span>₹{formatAmount(data.amount)}</span>
        </div>

        {data.currency && (
          <div className="detail-item">
            <span>Currency:</span>
            <span>{data.currency.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* ---------------- EMI Details ---------------- */}
      {data.emiId && (
        <div className="emi-section">
          <h3>EMI Details</h3>

          <div className="detail-item">
            <span>EMI ID:</span>
            <span>{data.emiId}</span>
          </div>

          <div className="detail-item">
            <span>Total Months:</span>
            <span>{data.months}</span>
          </div>

          <div className="detail-item">
            <span>Monthly EMI:</span>
            <span>₹{formatAmount(data.monthlyAmount)}</span>
          </div>
        </div>
      )}

      {/* ---------------- Subscription Details ---------------- */}
      {data.subscriptionId && (
        <div className="subscription-details">
          <h3>Subscription Details</h3>

          <div className="detail-item">
            <span>Subscription ID:</span>
            <span>{data.subscriptionId}</span>
          </div>

          <div className="detail-item">
            <span>Period:</span>
            <span>{data.period}</span>
          </div>
        </div>
      )}

      {/* ---------------- Order Items ---------------- */}
      {Array.isArray(data.cartItems) && data.cartItems.length > 0 && (
        <div className="order-items">
          <h3>Ordered Items</h3>
          <table className="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price (₹)</th>
                <th>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {data.cartItems.map((item, index) => (
                <tr key={index}>
                  <td>{item.title}</td>
                  <td>{item.quantity}</td>
                  <td>{formatAmount(item.price)}</td>
                  <td>{formatAmount(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4>Total Paid: ₹{formatAmount(data.amount)}</h4>
        </div>
      )}

      <button className="continue-btn" onClick={() => navigate("/")}>
        Continue Shopping
      </button>
    </div>
  );
}
