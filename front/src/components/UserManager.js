import React, { useEffect, useState } from "react";
import api from "../api";

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load users");
    }
  }

  async function toggleUserStatus(user) {
    try {
      await api.put(`/admin/users/${user.id}`, {
        ...user,
        isActive: !user.isActive,
      });
      loadUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to update user status");
    }
  }

  return (
    <div>
      <h2>Users</h2>
      <div className="report-list">
        {users.map((u) => (
          <div
            key={u.id}
            className="report-item"
            onClick={() => setExpanded(expanded === u.id ? null : u.id)}
          >
            <div className="report-summary">
              <span><strong>{u.name}</strong></span>
              <span>{u.email}</span>
              <span>{u.isActive ? "🟢 Active" : "🔴 Deactivated"}</span>
            </div>

            {expanded === u.id && (
              <div className="report-details">
                <p><strong>Role:</strong> {u.role}</p>
                <div className="report-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleUserStatus(u);
                    }}
                    className={u.isActive ? "deactivate-btn" : "activate-btn"}
                  >
                    {u.isActive ? "Deactivate" : "Activate"}
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
