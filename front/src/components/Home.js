import React, { useState, useEffect } from 'react';
import ProductList from './ProductList';
import banner1 from './banner3.jpg';
import banner2 from './banner2.jpg';
import './Home.css';

export default function Home() {
  const categories = ["All", "Men's Clothing", "Women's Clothing", "Electronics", "Jewelry"];
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Map banners to categories
  const banners = [
    { image: banner1, category: "Electronics", title: "Latest Electronics", desc: "Smart gadgets & accessories" },
    { image: banner2, category: "Men's Clothing", title: "Trending Men's Wear", desc: "Upgrade your wardrobe today" }
  ];

  const [currentBanner, setCurrentBanner] = useState(0);

  // Auto-slide banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="home-container">
      {/* Hero Banner */}
      <section
        className="banner"
        style={{ backgroundImage: `url(${banners[currentBanner].image})` }}
        onClick={() => setSelectedCategory(banners[currentBanner].category)}
      >
        <div className="banner-overlay"></div>
        <div className="banner-content">
          <h1>{banners[currentBanner].title}</h1>
          <p>{banners[currentBanner].desc}</p>
          <button 
            className="shop-btn"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCategory(banners[currentBanner].category);
            }}
          >
            Shop {banners[currentBanner].category}
          </button>
        </div>

        {/* Banner Dots */}
        <div className="banner-dots">
          {banners.map((_, i) => (
            <span
              key={i}
              className={`dot ${i === currentBanner ? 'active' : ''}`}
              onClick={() => setCurrentBanner(i)}
            ></span>
          ))}
        </div>
      </section>

      {/* Categories slider (no buttons) */}
      <section className="categories-slider">
        <div className="categories-wrapper">
          {categories.map((cat, index) => (
            <div
              key={index}
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </div>
          ))}
        </div>
      </section>

      {/* Product List */}
      <section className="products-section">
        <h2>{selectedCategory === 'All' ? 'Latest Products' : selectedCategory}</h2>
        <ProductList category={selectedCategory} />
      </section>
    </div>
  );
}
