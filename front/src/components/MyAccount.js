import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import api from "../api";
import "./MyAccount.css";

export default function MyAccount() {
  const { user, setUser, token } = useContext(AuthContext);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    avatar: user?.avatar || "",
  });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(user?.avatar || "");

  const [subscriptions, setSubscriptions] = useState([]);

  // ✅ Fetch subscriptions
  useEffect(() => {
    if (!token) return;
    api
      .get("/subscription/my-subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setSubscriptions(res.data))
      .catch((err) => console.error("Failed to fetch subscriptions", err));
  }, [token]);

  // ✅ Handle input changes
  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, avatar: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  // ✅ Save profile changes
  const handleSave = async () => {
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) =>
        data.append(key, value)
      );
      const res = await api.put(`/users/${user.id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(res.data);
      setEditMode(false);
      alert("Profile updated ✅");
    } catch (err) {
      console.error(err);
      alert("Update failed ❌");
    }
    setSaving(false);
  };

  return (
    <div className="account-container">
      {/* ----------- Profile Card ----------- */}
      <div className="account-card">
        <div className="avatar-section">
          <div className="account-avatar">
            <img src={preview} alt="Avatar" />
          </div>
          {editMode && (
            <label className="upload-btn">
              📤 Change
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </label>
          )}
        </div>

        <h2 className="account-title">My Account</h2>

        <div className="account-info">
          {["name", "email", "phone", "address"].map((field) => (
            <div key={field} className="info-row">
              <label>{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
              {editMode ? (
                <input
                  type={field === "email" ? "email" : "text"}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className="floating-input"
                />
              ) : (
                <span>{formData[field] || "-"}</span>
              )}
            </div>
          ))}
          <div className="info-row">
            <label>Role:</label>
            <span>{user?.role}</span>
          </div>
          <div className="info-row">
            <label>Member Since:</label>
            <span>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "-"}
            </span>
          </div>
        </div>

        <div className="account-actions">
          {editMode ? (
            <>
              <button
                className="btn save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "💾 Save"}
              </button>
              <button className="btn cancel" onClick={() => setEditMode(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button className="btn edit" onClick={() => setEditMode(true)}>
              ✏️ Edit
            </button>
          )}
        </div>
      </div>

      {/* ----------- Subscriptions ----------- */}
      <div className="subscription-section">
        <h2>My Subscriptions</h2>
        {subscriptions.length === 0 ? (
          <p>No subscriptions found.</p>
        ) : (
          subscriptions.map((s) => {
            let items = [];
            try {
              items = JSON.parse(s.items || "[]");
            } catch (e) {
              console.error("Failed to parse items", e);
            }

            return (
              <div key={s.subscription_id} className="subscription-card">
                <p>
                  <strong>ID:</strong> {s.subscription_id}
                </p>
                <p>
                  <strong>Period:</strong> {s.period}
                </p>
                <p>
                  <strong>Status:</strong> {s.status}
                </p>
                <p>
                  <strong>Created At:</strong>{" "}
                  {new Date(s.created_at).toLocaleDateString()}
                </p>
                <div>
                  <strong>Items:</strong>
                  <ul>
                    {items.map((item, i) => (
                      <li key={i}>
                        {item.title} × {item.quantity} = ₹
                        {item.price * item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
