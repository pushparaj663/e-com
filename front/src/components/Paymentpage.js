import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import api from "../api";
import "./Paymentpage.css";

const stripePromise = loadStripe(
  "pk_test_51Rysk01QHSw2U7iXqGXak3M0vnQ5dmWALuchfvpramRgNM9TLJl3FDiirYgh8MqeUFzt1cELlcbee0hsS2KrTzxa00J8Uhl7yP"
);

function PaymentForm() {
  const { state } = useLocation();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const { form, totalPrice, cart } = state || {};

  // Redirect if page refreshed
  useEffect(() => {
    if (!state) navigate("/checkout");
  }, [state, navigate]);


  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    // -------------------------
    // 🔍 DEBUGGING LOGS
    // -------------------------
    console.log("🔍 totalPrice received:", totalPrice);
    console.log("🔍 amount sent to backend (paise):", Math.round(totalPrice * 100));

    // ⛔ PREVENT payment below minimum (Stripe rule)
    if (totalPrice < 50) {
      alert("Minimum online payment is ₹50. Please increase your order amount or choose Cash on Delivery.");
      setLoading(false);
      return;
    }

    try {
      // 1️⃣ CREATE PAYMENT INTENT
      const res = await api.post("/create-payment-intent", {
        amount: Math.round(totalPrice * 100), // convert to paise
      });

      console.log("🔥 PaymentIntent response:", res.data);

      if (!res.data.clientSecret) {
        alert("Server error: No payment secret received.");
        setLoading(false);
        return;
      }

      const clientSecret = res.data.clientSecret;

      // 2️⃣ CONFIRM PAYMENT USING STRIPE
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: form.name,
            email: form.email,
          },
        },
      });

      console.log("🔥 Stripe result:", result);

      if (result.error) {
        alert(result.error.message || "Payment failed. Try again.");
        setLoading(false);
        return;
      }

      if (result.paymentIntent.status === "succeeded") {
        // 3️⃣ CREATE ORDER DATA TO SAVE
        const orderData = {
          userId: null,
          name: form.name,
          email: form.email,
          phone: form.phone,
          cartItems: cart.map((item) => ({
            id: item.id,
            title: item.title,
            quantity: Number(item.quantity),
            price: Number(item.price),
          })),
          status: result.paymentIntent.status,
          paymentId: result.paymentIntent.id,
          amount: result.paymentIntent.amount,
          currency: "INR",
          subscriptionId: null,
          period: null,
        };

        // 4️⃣ SAVE ORDER IN BACKEND
        await api.post("/save-payment", orderData);

        // 5️⃣ REDIRECT
        navigate("/payment-success", { state: orderData });
      }
    } catch (err) {
      console.error("❌ PAYMENT ERROR:", err.response?.data || err);
      alert(err.response?.data?.error || "Payment failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="payment-container" onSubmit={handlePayment}>
      <h2>Complete Your Payment</h2>

      <p><strong>Name:</strong> {form?.name}</p>
      <p><strong>Email:</strong> {form?.email}</p>
      <p><strong>Total:</strong> ₹{totalPrice}</p>

      <div className="stripe-box">
        <CardElement />
      </div>

      <button disabled={loading} className="pay-btn">
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}

export default function PaymentPage() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
}
