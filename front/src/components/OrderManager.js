import React, { useEffect, useState } from "react";
import api from "../api";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const res = await api.get("/admin/orders");
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load orders");
    }
  }

  return (
    <div>
      <h2>Orders</h2>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        orders.map((o) => (
          <div className="order-card" key={o.orderId}>
            <div className="order-header">
              <p><strong>Order ID:</strong> {o.orderId}</p>
              <p><strong>User:</strong> {o.userName}</p>
              <p><strong>Total:</strong> ₹{o.total}</p>
              <select
                value={o.status}
                onChange={async (e) => {
                  const newStatus = e.target.value;
                  await api.put(`/admin/orders/${o.orderId}`, { status: newStatus });
                  loadOrders();
                }}
              >
                <option value="pending">Pending</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
            <div className="order-items">
              {o.items?.map((item) => (
                <div className="order-item" key={item.id}>
                  <p>{item.title}</p>
                  <p>{item.quantity}</p>
                  <p>₹{item.price}</p>
                  <p>₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
