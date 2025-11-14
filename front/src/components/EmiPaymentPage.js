import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import api from "../api";

const stripePromise = loadStripe("pk_test_51Rysk01QHSw2U7iXqGXak3M0vnQ5dmWALuchfvpramRgNM9TLJl3FDiirYgh8MqeUFzt1cELlcbee0hsS2KrTzxa00J8Uhl7yP");

function EmiForm() {
  const { state } = useLocation();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const { form, totalPrice, cart, months } = state || {};

  // Redirect if no state
  useEffect(() => {
    if (!state) navigate("/checkout");
  }, [state, navigate]);

  // ⭐ Monthly EMI validation
  const monthlyAmount = months ? (totalPrice / months) : 0;
  const isInvalidEMI = monthlyAmount < 50;

  const handleEmiPayment = async (e) => {
    e.preventDefault();

    if (isInvalidEMI) {
      alert("Minimum EMI allowed is ₹50/month. Reduce EMI months.");
      return;
    }

    setLoading(true);

    try {
      const totalAmountPaise = Math.round(totalPrice * 100);

      // 1️⃣ Create EMI
      const emiRes = await api.post("/subscription/create-emi", {
        totalAmount: totalAmountPaise,
        months,
      });

      const { clientSecret, setupClientSecret, monthlyAmount, emiId } = emiRes.data;

      if (!clientSecret || !setupClientSecret) {
        alert("Failed to create EMI session.");
        setLoading(false);
        return;
      }

      // 2️⃣ First payment now
      const card = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: form.name,
            email: form.email,
          },
        },
      });

      if (result.error) {
        alert(result.error.message);
        setLoading(false);
        return;
      }

      // 3️⃣ Save card for future payments
      const setupResult = await stripe.confirmCardSetup(setupClientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: form.name,
            email: form.email,
          },
        },
      });

      if (setupResult.error) {
        alert(setupResult.error.message);
        setLoading(false);
        return;
      }

      const paymentMethodId = setupResult.setupIntent.payment_method;

      // 4️⃣ Attach card on backend
      await api.post("/subscription/attach-payment-method", {
        paymentMethodId
      });

      // 5️⃣ Save order + payment
      await api.post("/subscription/save-payment", {
        paymentId: result.paymentIntent.id,
        amount: result.paymentIntent.amount,
        currency: "INR",
        status: result.paymentIntent.status,
        cartItems: cart,
        emiId,
      });

      // 6️⃣ Redirect
      navigate("/payment-success", {
        state: {
          paymentId: result.paymentIntent.id,
          amount: result.paymentIntent.amount / 100,
          emiId,
          months,
          monthlyAmount,
        },
      });

    } catch (err) {
      console.error("EMI ERROR:", err);
      alert(err.response?.data?.error || "EMI payment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="payment-container" onSubmit={handleEmiPayment}>
      <h2>EMI Payment</h2>
      <p><strong>Name:</strong> {form?.name}</p>
      <p><strong>Total Amount:</strong> ₹{totalPrice}</p>
      <p><strong>Months:</strong> {months}</p>
      <p><strong>Monthly EMI:</strong> ₹{Math.round(monthlyAmount)}</p>

      {isInvalidEMI && (
        <p style={{ color: "red", marginBottom: 10 }}>
          Minimum EMI allowed is <strong>₹50/month</strong>.  
          Please reduce the number of months.
        </p>
      )}

      <div className="stripe-box">
        <CardElement />
      </div>

      <button disabled={loading || isInvalidEMI} className="pay-btn">
        {loading ? "Processing..." : "Start EMI"}
      </button>
    </form>
  );
}

export default function EmiPaymentPage() {
  return (
    <Elements stripe={stripePromise}>
      <EmiForm />
    </Elements>
  );
}
