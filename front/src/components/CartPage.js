import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const increment = (item) => updateQuantity(item.cartId, item.quantity + 1);
  const decrement = (item) => {
    if (item.quantity > 1) updateQuantity(item.cartId, item.quantity - 1);
  };

  const handleRemove = (item) => removeFromCart(item.cartId);

  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const finalPrice = Math.max(totalPrice - discount, 0);

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (code === 'DISCOUNT10') {
      setDiscount(totalPrice * 0.1);
      setAppliedCoupon(code);
    } else if (code === 'FLAT100') {
      setDiscount(100);
      setAppliedCoupon(code);
    } else {
      setDiscount(0);
      setAppliedCoupon('');
      alert('Invalid coupon');
    }
  };

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>

      {cart.length === 0 ? (
        <p style={{ color: '#555', textAlign: 'center' }}>Cart is empty</p>
      ) : (
        <>
          {cart.map(item => (
            <div key={item.cartId} className="cart-item">
              <img
                src={item.image_url}
                alt={item.title}
                onClick={() => setSelectedProduct(item)}
                style={{ cursor: 'pointer' }}
              />

              <div className="cart-item-info">
                <h3>{item.title}</h3>
                <p className="price">₹{item.price}</p>

                <div className="quantity-controls">
                  <button className="quantity-btn" onClick={() => decrement(item)}>-</button>
                  <span>{item.quantity}</span>
                  <button className="quantity-btn" onClick={() => increment(item)}>+</button>
                </div>

                <p className="subtotal">Subtotal: ₹{item.price * item.quantity}</p>
              </div>

              <button className="remove-btn" onClick={() => handleRemove(item)}>Remove</button>
            </div>
          ))}

          {/* Coupon Section */}
          <div className="coupon-section">
            <input
              type="text"
              placeholder="Enter coupon code"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
            />
            <button className="apply-coupon-btn" onClick={applyCoupon}>Apply</button>
            {appliedCoupon && <span className="coupon-badge">Applied: {appliedCoupon}</span>}
          </div>

          {/* Total Section */}
          <div className="cart-total">
            {discount > 0 && (
              <p style={{ color: '#28a745', marginBottom: '0.5rem' }}>
                Discount: ₹{discount.toFixed(2)}
              </p>
            )}
            <span>Total: ₹{finalPrice.toFixed(2)}</span>
            <button className="checkout-btn" onClick={() => navigate('/checkout')}>
              Proceed to Checkout
            </button>
          </div>
        </>
      )}

      {/* Product Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)}>X</button>
            <img src={selectedProduct.image_url} alt={selectedProduct.title} />
            <h3>{selectedProduct.title}</h3>
            <p><strong>Price:</strong> ₹{selectedProduct.price}</p>
            {selectedProduct.description && (
              <p><strong>Description:</strong> {selectedProduct.description}</p>
            )}
            <p><strong>Quantity:</strong> {selectedProduct.quantity}</p>
          </div>
        </div>
      )}
    </div>
  );
}
