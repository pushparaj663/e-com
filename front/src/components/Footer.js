import React, { useState, useEffect } from 'react';
import './Footer.css';
import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube, FaArrowUp } from 'react-icons/fa';

export default function Footer() {
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) setShowTopBtn(true);
      else setShowTopBtn(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Company Info */}
        <div className="footer-section">
          <h4>Company</h4>
          <ul>
            <li><a href="/">About Us</a></li>
            <li><a href="/">Careers</a></li>
            <li><a href="/">Press</a></li>
            <li><a href="/">Blog</a></li>
          </ul>
        </div>

        {/* Help */}
        <div className="footer-section">
          <h4>Help</h4>
          <ul>
            <li><a href="/">Customer Service</a></li>
            <li><a href="/">Returns</a></li>
            <li><a href="/">Shipping</a></li>
            <li><a href="/">FAQ</a></li>
          </ul>
        </div>

        {/* Account */}
        <div className="footer-section">
          <h4>Account</h4>
          <ul>
            <li><a href="/account">My Account</a></li>
            <li><a href="/orders">Orders</a></li>
            <li><a href="/wishlist">Wishlist</a></li>
            <li><a href="/cart">Cart</a></li>
          </ul>
        </div>

        {/* Newsletter & Social */}
        <div className="footer-section">
          <h4>Newsletter</h4>
          <p>Subscribe to get the latest updates and offers.</p>
          <div className="newsletter">
            <input type="email" placeholder="Enter your email" />
            <button>Subscribe</button>
          </div>
          <div className="social-icons">
            <a href="/"><FaFacebookF /></a>
            <a href="/"><FaTwitter /></a>
            <a href="/"><FaInstagram /></a>
            <a href="/"><FaYoutube /></a>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} YourStore. All Rights Reserved.
      </div>

      {showTopBtn && (
        <button className="back-to-top" onClick={scrollToTop}>
          <FaArrowUp />
        </button>
      )}
    </footer>
  );
}
