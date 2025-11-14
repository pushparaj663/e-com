import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState([]);

  // Fetch cart when user logs in or changes
  useEffect(() => {
    if (user) fetchCart();
    else setCart([]);
  }, [user]);

  // Fetch cart items from backend
  async function fetchCart() {
    try {
      const res = await api.get('/cart');
      setCart(res.data);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  }

  // Add product to cart
  async function addToCart(productId, quantity = 1) {
    try {
      const res = await api.post('/cart', { productId, quantity });
      setCart(res.data);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  }

  // Update quantity of a cart item (for + / - buttons)
  async function updateQuantity(cartId, quantity) {
    try {
      // Call backend API to update
      const res = await api.put(`/cart/${cartId}`, { quantity });
      // Update cart state
      setCart(res.data);
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  }

  // Remove a cart item
  async function removeFromCart(cartId) {
    try {
      const res = await api.delete(`/cart/${cartId}`);
      setCart(res.data);
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  }

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook for easier access
export function useCart() {
  return useContext(CartContext);
}
