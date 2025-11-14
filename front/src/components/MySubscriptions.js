import React, { useEffect, useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../contexts/AuthContext";
import "./MySub.css";

export default function MySubscriptions() {
  const { token } = useContext(AuthContext);
  const [subs, setSubs] = useState([]);

  useEffect(() => {
    if (!token) return;

    api.get("/subscription/my-subscriptions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setSubs(res.data))
      .catch(err => console.error("Failed to fetch subscriptions", err));
  }, [token]);

  return (
    <div className="my-subscriptions">
      <h2>My Subscriptions</h2>
      {subs.length === 0 ? (
        <p>No subscriptions found.</p>
      ) : (
        subs.map(s => (
          <div key={s.subscription_id} className="subscription-card">
            <p><strong>ID:</strong> {s.subscription_id}</p>
            <p><strong>Product:</strong> {s.product_title}</p>
            <p><strong>Period:</strong> {s.period}</p>
            <p><strong>Status:</strong> {s.status}</p>
            <p><strong>Created At:</strong> {new Date(s.created_at).toLocaleDateString()}</p>
          </div>
        ))
      )}
    </div>
  );
}
