import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useCart } from '../contexts/CartContext';
import './ProductList.css';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  // Pagination & sort state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [priceSort, setPriceSort] = useState('none');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data);
      } catch (err) {
        console.error('API error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = product => {
    addToCart(product.id, 1);
    alert(`${product.title} added to cart!`);
  };

  if (loading) return <p className="loading">Loading products...</p>;

  // Sort by price
  let sortedProducts = [...products];
  if (priceSort === 'asc') sortedProducts.sort((a, b) => a.price - b.price);
  if (priceSort === 'desc') sortedProducts.sort((a, b) => b.price - a.price);

  // Pagination
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  return (
    <div className="product-list-container">
      {/* Sort & Limit Controls */}
      <div className="product-controls">
        <div className="sort-limit">
          <label>
            Sort by Price:
            <select value={priceSort} onChange={e => setPriceSort(e.target.value)}>
              <option value="none">None</option>
              <option value="asc">Low → High</option>
              <option value="desc">High → Low</option>
            </select>
          </label>

          <label>
            Items per page:
            <select value={itemsPerPage} onChange={e => { 
              setItemsPerPage(Number(e.target.value)); 
              setCurrentPage(1); 
            }}>
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </label>
        </div>
      </div>

      {/* Product Grid */}
      <div className="product-grid">
        {currentProducts.map(product => (
          <div key={product.id} className="product-card">
            {product.discount && <span className="badge">{product.discount}% OFF</span>}
            <img
              src={product.image_url}
              alt={product.title}
              loading="lazy"
              onError={e => (e.target.src = '/placeholder.png')}
            />
            <h3>{product.title}</h3>
            <p className="price">₹{product.price}</p>
            <div className="card-buttons">
              <Link to={`/products/${product.id}`} className="view-btn">View</Link>
              <button onClick={() => handleAddToCart(product)} className="add-cart-btn">
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
            Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              className={currentPage === i + 1 ? 'active' : ''}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
