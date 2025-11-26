import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import "./Paymentpage.css";

export default function PaymentPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const { form, totalPrice, cart } = state || {};

  // redirect if page reloads
  useEffect(() => {
    if (!state) navigate("/checkout");
  }, [state, navigate]);

  // Load Razorpay script dynamically
  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1️⃣ Create Razorpay Order on backend
      const orderRes = await api.post("/api/payment/create-order", {
        amount: Math.round(totalPrice * 100),   // paise
      });

      const { order } = orderRes.data;
      if (!order) {
        alert("Failed to create order");
        setLoading(false);
        return;
      }

      // 2️⃣ Razorpay Checkout Options
      const options = {
        key: process.env.REACT_APP_RZP_KEY_ID || "rzp_test_Rgh0l6uEoclw3z",
        amount: order.amount,
        currency: order.currency,
        name: "E-Commerce Store",
        description: "Order Payment",
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3️⃣ Verify Payment on backend
            const verifyRes = await api.post("/api/payment/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,

              // extra order info
              name: form.name,
              email: form.email,
              phone: form.phone,
              address: form.address,
              cartItems: cart,
              amount: order.amount,
              currency: order.currency,
            });

            if (verifyRes.data.success) {
              navigate("/payment-success", { state: verifyRes.data.order });
            } else {
              alert("Payment verification failed");
            }
          } catch (err) {
            console.error("Verification Error:", err);
            alert("Payment verification failed");
          }
        },

        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },

        theme: {
          color: "#0e9f6e",
        },
      };

      // 4️⃣ Open Razorpay Widget
      const rzp = new window.Razorpay(options);
      rzp.open();

      rzp.on("payment.failed", function (response) {
        alert("Payment Failed: " + response.error.description);
      });
    } catch (err) {
      console.error("Razorpay Error:", err);
      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="payment-container" onSubmit={handlePayment}>
      <h2>Complete Payment</h2>

      <p><strong>Name:</strong> {form?.name}</p>
      <p><strong>Email:</strong> {form?.email}</p>
      <p><strong>Total:</strong> ₹{totalPrice}</p>

      <button className="pay-btn" disabled={loading}>
        {loading ? "Processing..." : "Pay with Razorpay"}
      </button>
    </form>
  );
}
