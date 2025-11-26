import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { UserProvider } from './contexts/UserContext';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

// Inline Sandbox Client ID
const paypalOptions = {
  "client-id": "Adeg5392HJx3NlZFuuUYrZAEtpEdDEipjjFSdQD0AalmOXGcGF39vnMfUD7walX-DAsyAfed-GoWxSD3",
  currency: "USD"
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <PayPalScriptProvider options={paypalOptions}>
    <UserProvider>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </UserProvider>
  </PayPalScriptProvider>
);
