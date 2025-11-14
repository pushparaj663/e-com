import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../contexts/CartContext';
import { AuthContext } from '../contexts/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { cart } = useContext(CartContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  const totalQty = (cart || []).reduce((a, b) => a + (b.quantity || 0), 0);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Close menu if click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="logo">MyShop</Link>

        {/* Hamburger for mobile */}
        <div className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Navbar menu */}
        <div ref={menuRef} className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/products" onClick={() => setMenuOpen(false)}>Products</Link>

          {user?.role !== 'admin' && (
            <Link to="/cart" className="cart-link" onClick={() => setMenuOpen(false)}>
              Cart {totalQty > 0 && <span className="cart-badge">{totalQty}</span>}
            </Link>
          )}

          {user ? (
            <>
              <Link to="/account" className="account-link" onClick={() => setMenuOpen(false)}>
                👤 {user.name}
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" onClick={() => setMenuOpen(false)}>Menu</Link>
              )}
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="login-btn" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/signup" className="signup-btn" onClick={() => setMenuOpen(false)}>Signup</Link>
            </>
          )}
        </div>
      </nav>

      {/* Overlay for mobile menu */}
      {menuOpen && (
        <div className="overlay active" onClick={() => setMenuOpen(false)}></div>
      )}
    </>
  );
}
