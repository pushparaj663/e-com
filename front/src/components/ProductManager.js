import React, { useEffect, useState } from "react";
import api from "../api";

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load products");
    }
  }

  async function toggleProductStatus(product) {
    try {
      await api.put(`/admin/products/${product.id}`, {
        ...product,
        isActive: !product.isActive,
      });
      loadProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to update product status");
    }
  }

  async function updateStock(product, newStock) {
    try {
      await api.put(`/admin/products/${product.id}/stock`, {
        stock: newStock,
      });
      loadProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to update stock");
    }
  }

  return (
    <div>
      <h2>Products</h2>
      <div className="report-list">
        {products.map((p) => (
          <div
            key={p.id}
            className="report-item"
            onClick={() => setExpanded(expanded === p.id ? null : p.id)}
          >
            <div className="report-summary">
              <span><strong>{p.title}</strong></span>
              <span>₹{p.price}</span>
              <span>{p.isActive ? "🟢 Active" : "🔴 Deactivated"}</span>
            </div>

            {expanded === p.id && (
              <div className="report-details">
                {p.image_url && <img src={p.image_url} alt={p.title} />}
                <p><strong>Category:</strong> {p.category}</p>
                <p><strong>Description:</strong> {p.description}</p>

                <div className="stock-control">
                  <label>Stock:</label>
                  <input
                    type="number"
                    defaultValue={p.stock}
                    min="0"
                    onBlur={(e) => updateStock(p, e.target.value)}
                  />
                </div>

                <div className="report-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleProductStatus(p);
                    }}
                    className={p.isActive ? "deactivate-btn" : "activate-btn"}
                  >
                    {p.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
