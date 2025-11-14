import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import api from "../api";

const stripePromise = loadStripe("pk_test_YOUR_STRIPE_KEY");

function SubscriptionForm({ userId, productId, priceId }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await api.post("/subscription/create-subscription", { userId, productId, priceId });
      const clientSecret = res.data.clientSecret;

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) }
      });

      if (result.error) {
        alert(result.error.message);
      } else if (result.paymentIntent.status === "succeeded") {
        alert("Subscription successful!");
      }
    } catch (err) {
      console.error(err);
      alert("Subscription failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <CardElement />
      <button onClick={handleSubscribe} disabled={loading}>
        {loading ? "Processing..." : "Subscribe"}
      </button>
    </div>
  );
}

export default function SubscriptionWrapper({ userId, productId, priceId }) {
  return (
    <Elements stripe={stripePromise}>
      <SubscriptionForm userId={userId} productId={productId} priceId={priceId} />
    </Elements>
  );
}
