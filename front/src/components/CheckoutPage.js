// src/pages/CheckoutPage.jsx
import React, { useState, useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./CheckoutPage.css";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart(); // must exist in CartContext
  const { user } = useUser();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("upi");

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: "",
    city: "",
    pincode: "",
    upiId: "",
  });

  const [loading, setLoading] = useState(false);

  // INR total
  const totalPrice = cart.reduce(
    (acc, item) => acc + Number(item.price) * Number(item.quantity),
    0
  );

  // Convert INR → USD
  const totalUSD = (totalPrice / 83).toFixed(2);

  // Load PayPal Sandbox SDK
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateAddress = () => {
    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.address ||
      !form.city ||
      !form.pincode
    ) {
      alert("Please fill all address details");
      return false;
    }
    if (cart.length === 0) {
      alert("Your cart is empty");
      return false;
    }
    return true;
  };

  const startRazorpayPayment = async () => {
    if (!validateAddress()) return;

    try {
      // 1️⃣ Create order
      const res = await api.post("/payment/razorpay/create", {
  amount: Math.round(totalPrice * 1)  // send paisa
});


      const order = res.data.order;

      // 2️⃣ Open Razorpay modal
      const options = {
        key: "rzp_test_RkGMlkiTUjv4G3",
        amount: order.amount,
        currency: "INR",
        name: "My Ecom Store",
        description: "Order Payment",
        order_id: order.id,

        handler: async function (response) {
          // 3️⃣ Verify payment
          const verifyRes = await api.post("/payment/razorpay/verify", {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,

            cartItems: cart,
            amount: totalPrice
          });

          if (verifyRes.data.success) {
            clearCart();
            navigate("/payment-success");
          } else {
            alert("Payment verification failed");
          }
        },

        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone
        },

        theme: { color: "#3399cc" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Razorpay Error:", error);
      alert("Payment failed. Please try again.");
    }
  };


  // COD
  const handleCOD = async () => {
    if (!validateAddress()) return;
    setLoading(true);

    try {
      const orderData = {
        userId: user?.id || null,
        ...form,
        cartItems: cart,
        amount: totalPrice * 100,
        currency: "INR",
        status: "pending",
        method: "COD",
      };

      await api.post("/api/payment/save-order-cod", orderData);

      clearCart?.();
      navigate("/payment-success", { state: orderData });
    } catch (err) {
      console.error("COD error:", err);
      alert("Order failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUPIPay = () => {
    if (!validateAddress()) return;
    if (!form.upiId) return alert("Enter UPI ID");

    alert("UPI gateway coming soon.");
  };

  const handleNetBanking = () => {
    if (!validateAddress()) return;
    alert("Net banking coming soon.");
  };

  return (
    <div className="checkout-page-wrap">
      <div className="checkout-main">
        {/* Address */}
        <div className="address-card">
          <h3>Delivery Address</h3>

          <div className="address-grid">
            <input name="name" value={form.name} placeholder="Full Name" onChange={handleChange} />
            <input name="phone" value={form.phone} placeholder="Phone" onChange={handleChange} />
          </div>

          <input name="email" value={form.email} placeholder="Email" onChange={handleChange} />
          <input name="address" value={form.address} placeholder="Full Address" onChange={handleChange} />

          <div className="address-grid">
            <input name="city" value={form.city} placeholder="City" onChange={handleChange} />
            <input name="pincode" value={form.pincode} placeholder="Pincode" onChange={handleChange} />
          </div>
        </div>

        {/* Payment Options */}
        <div className="pay-layout">
          <div className="pay-left">
            <ul className="pay-options">
              <li className={activeTab === "upi" ? "active" : ""} onClick={() => setActiveTab("upi")}>UPI</li>
              <li className={activeTab === "card" ? "active" : ""} onClick={() => setActiveTab("card")}>Card (PayPal)</li>
              <li className={activeTab === "net" ? "active" : ""} onClick={() => setActiveTab("net")}>Net Banking</li>
              <li className={activeTab === "cod" ? "active" : ""} onClick={() => setActiveTab("cod")}>COD</li>
            </ul>
          </div>

          <div className="pay-center">
            {/* UPI */}
            {activeTab === "upi" && (
              <div>
                <input name="upiId" value={form.upiId} placeholder="Enter UPI ID" onChange={handleChange} />
                <button className="pay-big-btn" onClick={handleUPIPay}>Pay ₹{totalPrice}</button>
              </div>
            )}

            {/* PayPal CARD */}
            {activeTab === "card" && (
              <div>
                <h4>Pay with PayPal</h4>
               <button className="pay-big-btn" onClick={startRazorpayPayment}>
          Pay ₹{totalPrice} with Razorpay
        </button>
                <div id="paypal-card-container" style={{ marginTop: "16px" }} />
              </div>
            )}

            {/* Net Banking */}
            {activeTab === "net" && (
              <div>
                <button className="pay-big-btn" onClick={handleNetBanking}>Pay ₹{totalPrice}</button>
              </div>
            )}

            {/* COD */}
            {activeTab === "cod" && (
              <div>
                <button className="pay-big-btn" onClick={handleCOD}>
                  Confirm Order (₹{totalPrice})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="checkout-summary">
        <h3>Order Summary</h3>
        {cart.map((item) => (
          <div key={item.id}>{item.name} — {item.quantity} × ₹{item.price}</div>
        ))}
        <hr />
        <strong>Total: ₹{totalPrice} ($ {totalUSD})</strong>
      </div>
    </div>
  );
}
