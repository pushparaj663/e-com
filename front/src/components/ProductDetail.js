import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useUser } from "../contexts/UserContext";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import api from "../api";
import "./ProductDetail.css";

const stripePromise = loadStripe("pk_test_YourStripePublishableKey");

// ----------------- EMI Checkout Form -----------------
function EmiCheckoutForm({ priceId, months }) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const res = await api.post("/subscription/create-subscription", { priceId });
      const { clientSecret } = res.data;

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { email: user.email, name: user.name },
        },
      });

      if (result.error) alert(result.error.message);
      else if (result.paymentIntent?.status === "succeeded") {
        alert(`✅ Subscribed for ${months}-month plan successfully!`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Subscription failed");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubscribe} className="emi-form">
      <CardElement options={{ hidePostalCode: true }} />
      <button type="submit" disabled={loading || !stripe}>
        {loading ? "Processing..." : `Subscribe (${months}-month)` }
      </button>
    </form>
  );
}

// ----------------- Product Details Page -----------------
export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [emiPlans, setEmiPlans] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Fetch product
  useEffect(() => {
    api.get(`/products/${id}`)
      .then(res => setProduct(res.data))
      .catch(console.error);
  }, [id]);

  // Fetch EMI plans
  useEffect(() => {
    api.get(`/subscription/product/${id}/emi-plans`)
      .then(res => setEmiPlans(res.data))
      .catch(console.error);
  }, [id]);

  // Fetch related products
  useEffect(() => {
    if (product) {
      api.get("/products")
        .then(res => setRelated(res.data.filter(p => p.id !== product.id).slice(0,4)))
        .catch(console.error);
    }
  }, [product]);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      await addToCart(product.id, 1);
      alert("✅ Product added to cart!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to add product.");
    }
    setLoading(false);
  };

  if (!product) return <div className="loading">Loading product...</div>;

  return (
    <>
      <button onClick={() => navigate("/products")} className="back-btn">← Back</button>
      <div className="product-detail-container">
        <img src={product.image_url} alt={product.title} />
        <div className="product-detail-info">
          <h2>{product.title}</h2>
          {product.discount && <span className="discount-badge">{product.discount}% OFF</span>}
          <p>{product.description}</p>
          <p className="product-detail-price">₹{product.price}</p>

          <button onClick={handleAddToCart} disabled={loading}>
            {loading ? "Adding..." : "🛒 Add to Cart"}
          </button>

          {/* EMI / Subscription Options */}
          {emiPlans.length > 0 && (
            <div className="emi-options">
              <h4>Subscribe & Save</h4>
              {emiPlans.map((plan, i) => (
                <Elements key={i} stripe={stripePromise}>
                  <EmiCheckoutForm priceId={plan.priceId} months={plan.months} />
                </Elements>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="related-products">
          <h3>You may also like</h3>
          <div className="related-grid">
            {related.map(item => (
              <div key={item.id} className="related-card">
                {item.discount && <span className="small-badge">{item.discount}% OFF</span>}
                <img src={item.image_url} alt={item.title} />
                <h4>{item.title}</h4>
                <p>₹{item.price}</p>
                <div className="related-buttons">
                  <Link to={`/products/${item.id}`} className="view-btn">View</Link>
                  <button onClick={() => addToCart(item.id, 1)}>+ Cart</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
