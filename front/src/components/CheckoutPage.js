import React, { useState } from "react";
import { useCart } from "../contexts/CartContext";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import api from "../api";
import "./CheckoutPage.css";

const stripePromise = loadStripe(
  "pk_test_51Rysk01QHSw2U7iXqGXak3M0vnQ5dmWALuchfvpramRgNM9TLJl3FDiirYgh8MqeUFzt1cELlcbee0hsS2KrTzxa00J8Uhl7yP"
);

function CheckoutForm({ totalPrice }) {
  const { cart } = useCart();
  const { user } = useUser();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    payment: "cod",
    subscribe: false,
    period: "monthly",
  });

  const [loading, setLoading] = useState(false);

  // ⭐ EMI STATE
  const [emi, setEmi] = useState({
    enabled: false,
    months: 3,
  });

  // Handle input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  // Main Checkout Handler
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.phone || !form.address) {
      alert("Please fill all required fields");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    // Make sure Stripe is ready
    if (form.payment === "card" && !stripe) {
      alert("Stripe is not ready yet. Try again in 1 second.");
      return;
    }

    // ⭐ EMI CHECK
    if (emi.enabled) {
      navigate("/payment-emi", {
        state: { form, totalPrice, cart, months: emi.months },
      });
      return;
    }

    setLoading(true);

    try {
      // ⭐ 1) RECURRING SUBSCRIPTION PAYMENT
      if (form.payment === "card" && form.subscribe) {
        console.log("Processing Subscription...");

        const productId = cart[0].id;
        const priceRes = await api.get(`/subscription/product/${productId}/price/${form.period}`);
        const priceId = priceRes.data.priceId;

        const subRes = await api.post("/subscription/create-recurring", { priceId });
        const { subscriptionId, clientSecret } = subRes.data;

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

        const orderData = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          cartItems: cart,
          paymentId: result.paymentIntent.id,
          amount: result.paymentIntent.amount,
          currency: "INR",
          status: result.paymentIntent.status,
          subscriptionId,
          period: form.period,
        };

        await api.post("/save-payment", orderData);
        navigate("/payment-success", { state: orderData });
        return;
      }

      // ⭐ 2) NORMAL CARD PAYMENT
      if (form.payment === "card" && !form.subscribe) {
        const res = await api.post("/create-payment-intent", {
          amount: Math.round(totalPrice * 100),
        });

        const clientSecret = res.data.clientSecret;
        const card = elements.getElement(CardElement);

        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card,
            billing_details: { name: form.name, email: form.email },
          },
        });

        if (result.error) {
          alert(result.error.message);
          setLoading(false);
          return;
        }
const orderData = {
  name: form.name,
  email: form.email,
  phone: form.phone,
  cartItems: cart,
  paymentId: result.paymentIntent.id,
  amount: result.paymentIntent.amount,
  currency: "INR",
  status: result.paymentIntent.status,
  subscriptionId,   // <-- OK HERE
  period: form.period,  // <-- OK HERE
};



        await api.post("/save-payment", orderData);
        navigate("/payment-success", { state: orderData });
        return;
      }

      // ⭐ 3) CASH ON DELIVERY
      if (form.payment === "cod") {
        const orderData = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          cartItems: cart,
          paymentId: null,
          amount: Math.round(totalPrice * 100),
          currency: "INR",
          status: "pending",
          subscriptionId: null,
          period: null,
        };

        await api.post("/save-payment", orderData);
        navigate("/payment-success", { state: orderData });
        return;
      }
    } catch (err) {
      console.error("Checkout Error:", err);
      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-content">
      <form className="checkout-form" onSubmit={handlePlaceOrder}>
        <h3>Billing Details</h3>

        <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email Address" value={form.email} onChange={handleChange} required />
        <input type="tel" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} required />
        <input type="text" name="address" placeholder="Street Address" value={form.address} onChange={handleChange} required />

        {/* PAYMENT */}
        <h3>Payment Method</h3>

        <label>
          <input type="radio" name="payment" value="cod" checked={form.payment === "cod"} onChange={handleChange} />
          Cash on Delivery
        </label>

        <label>
          <input type="radio" name="payment" value="card" checked={form.payment === "card"} onChange={handleChange} />
          Credit/Debit Card
        </label>

        {form.payment === "card" && (
          <div className="card-element-wrapper">
            <CardElement options={{ hidePostalCode: true }} />
          </div>
        )}

        {/* SUBSCRIPTION */}
        <h3>Subscription Option</h3>

        <label>
          <input type="checkbox" name="subscribe" checked={form.subscribe} onChange={handleChange} />
          Subscribe for monthly/yearly auto-delivery
        </label>

        {form.subscribe && (
          <div className="subscription-period">
            <label>
              <input type="radio" name="period" value="monthly" checked={form.period === "monthly"} onChange={handleChange} />
              Monthly
            </label>

            <label>
              <input type="radio" name="period" value="yearly" checked={form.period === "yearly"} onChange={handleChange} />
              Yearly
            </label>
          </div>
        )}

        {/* EMI */}
        <h3>EMI (Installments)</h3>

        <label>
          <input type="checkbox" checked={emi.enabled} onChange={() => setEmi((prev) => ({ ...prev, enabled: !prev.enabled }))} />
          Pay using EMI
        </label>

        {emi.enabled && (
          <div className="emi-options">
            <label>Select EMI duration:</label>
            <select value={emi.months} onChange={(e) => setEmi((prev) => ({ ...prev, months: Number(e.target.value) }))}>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={9}>9 months</option>
              <option value={12}>12 months</option>
            </select>

            <p>Monthly EMI: <strong>₹{(totalPrice / emi.months).toFixed(2)}</strong></p>
          </div>
        )}

        <button type="submit" className="place-order-btn" disabled={loading}>
          {loading ? "Processing..." : "Place Order"}
        </button>
      </form>
    </div>
  );
}

export default function CheckoutPageWrapper() {
  const { cart } = useCart();
  const totalPrice = cart.reduce((acc, item) => acc + Number(item.price) * Number(item.quantity), 0);

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm totalPrice={totalPrice} />
    </Elements>
  );
}
