import React, { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import api from "../api";
import { useNavigate } from "react-router-dom";
import "./EditProfile.css";

export default function EditProfile() {
  const { user, login } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      if (password) formData.append("password", password);
      if (avatar) formData.append("avatar", avatar);

      const res = await api.put("/auth/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      login(res.data.user, res.data.token); // update context
      alert("Profile updated successfully ✅");
      navigate("/my-account");
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  }

  return (
    <div className="edit-container">
      <form className="edit-form" onSubmit={handleSubmit}>
        <h2>Edit Profile</h2>

        {/* Avatar Upload */}
        <div className="avatar-upload">
          <label htmlFor="avatar">
            <div className="avatar-preview">
              {avatar ? (
                <img src={URL.createObjectURL(avatar)} alt="Preview" />
              ) : (
                <span>{user?.name?.charAt(0) || "U"}</span>
              )}
            </div>
          </label>
          <input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={(e) => setAvatar(e.target.files[0])}
          />
        </div>

        <label>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          required
        />

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />

        <label>Password (leave blank to keep current)</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
        />

        <button type="submit">💾 Save Changes</button>
      </form>
    </div>
  );
}
