import React, { useState, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  async function handle(e) {
  e.preventDefault();
  try {
    const res = await api.post('/auth/login', { email, password });

    // 🔥 Save token for authenticated cart requests
    localStorage.setItem("token", res.data.token);

    login(res.data.user, res.data.token);
    navigate('/');
  } catch (err) {
    alert(err.response?.data?.message || 'Login failed');
  }
}

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handle}>
        <h2>Login</h2>

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />

        <button type="submit">Login</button>

        {/* New Sign Up Link */}
        <p className="signup-text">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </form>
    </div>
  );
}
