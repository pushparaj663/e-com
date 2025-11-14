import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { UserProvider } from './contexts/UserContext';
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <UserProvider>
  <AuthProvider>
    <CartProvider>
      <App />
    </CartProvider>
  </AuthProvider>
  </UserProvider>
);
