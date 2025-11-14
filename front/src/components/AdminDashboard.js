import React, { useEffect, useState } from "react";
import api from "../api";
import "./AdminDashboard.css";
import { FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";

export default function AdminDashboard() {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedProductIndex, setSelectedProductIndex] = useState(null);

  /* ---------------------- LOAD DATA ---------------------- */
  useEffect(() => {
    async function loadAll() {
      if (tab === "products") await loadProducts();
      if (tab === "users") await loadUsers();
      if (tab === "orders") await loadOrders();
    }
    loadAll();
  }, [tab]);

  /* ---------------------- PRODUCTS ---------------------- */
  async function loadProducts() {
    try {
      const res = await api.get("/admin/products");
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load products");
    }
  }

  async function toggleProduct(id, active) {
    try {
      await api.put(`/admin/products/${id}/toggle`, { active });
      loadProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to update product status");
    }
  }

  async function removeProduct(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      loadProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to delete product");
    }
  }

  /* ---------------------- USERS ---------------------- */
  async function loadUsers() {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load users");
    }
  }

  async function toggleUser(id, active) {
    try {
      await api.put(`/admin/users/${id}/toggle`, { active });
      loadUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to toggle user");
    }
  }

  async function removeUser(id) {
    if (!window.confirm("Delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      loadUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  }

  /* ---------------------- ORDERS ---------------------- */
  async function loadOrders() {
    try {
      const res = await api.get("/admin/orders");
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load orders");
    }
  }

  async function updateOrderStatus(id, status) {
    try {
      await api.put(`/admin/orders/${id}`, { status });
      setOrders((prev) =>
        prev.map((ord) => (ord.orderId === id ? { ...ord, status: status } : ord))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update order");
    }
  }

  /* ---------------------- RENDER ---------------------- */
  return (
    <div className="admin-dashboard">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2>Admin Panel</h2>
        <nav>
          <button
            className={tab === "products" ? "active" : ""}
            onClick={() => setTab("products")}
          >
            Products
          </button>
          <button
            className={tab === "users" ? "active" : ""}
            onClick={() => setTab("users")}
          >
            Users
          </button>
          <button
            className={tab === "orders" ? "active" : ""}
            onClick={() => setTab("orders")}
          >
            Orders
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <h2>{(tab || "").charAt(0).toUpperCase() + (tab || "").slice(1)}</h2>

        {/* REPORT CARDS */}
        <div className="report-cards">
          <div className="card">
            <h3>Total Products</h3>
            <p>{products.length}</p>
          </div>
          <div className="card">
            <h3>Total Users</h3>
            <p>{users.length}</p>
          </div>
          <div className="card">
            <h3>Total Orders</h3>
            <p>{orders.length}</p>
          </div>
        </div>

        {/* PRODUCTS TABLE */}
        {tab === "products" && (
          <table className="report-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, index) => (
                <tr
                  key={p.id}
                  className={!p.active ? "inactive" : ""}
                  onClick={() => setSelectedProductIndex(index)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{p.title}</td>
                  <td>₹{p.price}</td>
                  <td>{p.stock}</td>
                  <td>{p.category}</td>
                  <td>{p.active ? "Yes" : "No"}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className={`toggle-btn ${!p.active ? "inactive" : ""}`}
                        onClick={(e) => { e.stopPropagation(); toggleProduct(p.id, !p.active); }}
                      >
                        {p.active ? <><FaToggleOff /> Deactivate</> : <><FaToggleOn /> Activate</>}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={(e) => { e.stopPropagation(); removeProduct(p.id); }}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* USERS TABLE */}
        {tab === "users" && (
          <table className="report-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={!u.active ? "inactive" : ""}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.active ? "Yes" : "No"}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className={`toggle-btn ${!u.active ? "inactive" : ""}`}
                        onClick={() => toggleUser(u.id, !u.active)}
                      >
                        {u.active ? <><FaToggleOff /> Deactivate</> : <><FaToggleOn /> Activate</>}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => removeUser(u.id)}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ORDERS TABLE */}
        {tab === "orders" && (
          <table className="report-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.orderId}>
                  <td>{o.orderId}</td>
                  <td>{o.userName || "Unknown"}</td>
                  <td>₹{o.total || 0}</td>
                  <td>
                    <span className={`status-badge ${o.status || ""}`}>
                      {(o.status || "pending").charAt(0).toUpperCase() + (o.status || "pending").slice(1)}
                    </span>
                    <select
                      value={o.status || "pending"}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        await updateOrderStatus(o.orderId, newStatus);
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </td>
                  <td>
                    <div>
                      <div><strong>ID:</strong> {o.payment_id || "N/A"}</div>
                      <div><strong>Method:</strong> {o.payment_method || "COD"}</div>
                      <div><strong>Amount:</strong> ₹{o.payment_amount || "0"}</div>
                      <div><strong>Currency:</strong> {o.currency || "INR"}</div>
                      <div><strong>Status:</strong> {o.payment_status || "N/A"}</div>
                    </div>
                  </td>
                  <td>
                    {o.items?.map((i) => (
                      <div key={i.id}>{i.title} x{i.quantity} (₹{i.price * i.quantity})</div>
                    )) || "No items"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ------------------ PRODUCT MODAL ------------------ */}
        {selectedProductIndex !== null && (
          <div className="modal-overlay" onClick={() => setSelectedProductIndex(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setSelectedProductIndex(null)}>×</button>
              <img
                src={products[selectedProductIndex].image_url || "/placeholder.png"}
                alt={products[selectedProductIndex].title}
              />
              <h3>{products[selectedProductIndex].title}</h3>
              <p><strong>Price:</strong> ₹{products[selectedProductIndex].price}</p>
              <p><strong>Stock:</strong> {products[selectedProductIndex].stock}</p>
              <p><strong>Category:</strong> {products[selectedProductIndex].category}</p>
              <p><strong>Description:</strong> {products[selectedProductIndex].description || "No description"}</p>
              <p><strong>Active:</strong> {products[selectedProductIndex].active ? "Yes" : "No"}</p>
              <div className="modal-nav">
                <button
                  disabled={selectedProductIndex === 0}
                  onClick={() => setSelectedProductIndex(selectedProductIndex - 1)}
                >
                  ← Previous
                </button>
                <button
                  disabled={selectedProductIndex === products.length - 1}
                  onClick={() => setSelectedProductIndex(selectedProductIndex + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
