// src/components/OrderSuccessPage.js
import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function OrderSuccessPage() {
  const location = useLocation();
  const { orderId, items, total } = location.state || {};

  if (!orderId) {
    return (
      <div>
        <h2>No order found</h2>
        <Link to="/">Go to Home</Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Order Placed Successfully!</h2>
      <p>Order ID: <strong>{orderId}</strong></p>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.productId}>
              <td>{item.title}</td>
              <td>{item.quantity}</td>
              <td>₹{item.price}</td>
              <td>₹{item.price * item.quantity}</td>
            </tr>
          ))}
          <tr>
            <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
            <td>₹{total}</td>
          </tr>
        </tbody>
      </table>
      <Link to="/">Back to Home</Link>
    </div>
  );
}
