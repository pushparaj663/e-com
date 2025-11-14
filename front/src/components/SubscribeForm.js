import React from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import api from "../api";

export default function SubscribeForm({ priceId, user }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubscribe = async () => {
    if (!stripe || !elements) return;

    const card = elements.getElement(CardElement);

    // 1️⃣ Create Payment Method
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: "card",
      card,
      billing_details: { email: user.email, name: user.name },
    });

    if (error) return alert(error.message);

    // 2️⃣ Call backend to create subscription
    const res = await api.post("/subscription/create-subscription", {
      userId: user.id,
      paymentMethodId: paymentMethod.id,
      priceId,
      email: user.email,
    });

    alert("Subscription created successfully!");
    console.log(res.data);
  };

  return (
    <div>
      <CardElement />
      <button onClick={handleSubscribe}>Subscribe</button>
    </div>
  );
}
