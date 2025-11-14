import React, { useState, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Signup.css';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  async function handle(e) {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', { name, email, password });
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Signup failed');
    }
  }

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handle}>
        <h2>Create Account</h2>

        {/* Floating Input Fields */}
        <div className="input-group">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder=""
            required
          />
          <label>Name</label>
        </div>

        <div className="input-group">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder=" "
            required
          />
          <label>Email</label>
        </div>

        <div className="input-group">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder=" "
            required
          />
          <label>Password</label>
        </div>

        <button type="submit">Sign Up</button>

        {/* Footer text */}
        <p className="signup-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
