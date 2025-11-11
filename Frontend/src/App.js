import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import CartPage from './components/CartPage';
import Login from './components/Login';
import Signup from './components/Signup';
import MyAccount from './components/MyAccount';
import AdminDashboard from './components/AdminDashboard';
import { AuthContext } from './contexts/AuthContext';
import { useContext } from 'react';
import CheckoutPage from './components/CheckoutPage';
import Footer from './components/Footer'; // Adjust the path if your Footer.js is elsewhere
import PaymentSuccess from "./components/PaymentSuccess";
import OrderSuccessPage from './components/OrderSuccessPage';

function PrivateRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user && user.role === 'admin' ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success" element={<OrderSuccessPage />} /> 
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/account" element={<PrivateRoute><MyAccount /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
        </Routes>
       
      </div>
      <Footer/>
    </BrowserRouter>
  );
}
