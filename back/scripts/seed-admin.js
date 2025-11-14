// backend/seed/seedAdminAndProducts.js
const pool = require('../db');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    // Admin user
    const adminEmail = 'admin@example.com';
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (!existing.length) {
      const hashed = await bcrypt.hash('admin123', 10);
      await pool.query('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)', ['Admin', adminEmail, hashed, 'admin']);
      console.log('Admin user created: admin@example.com / admin123');
    } else {
      console.log('Admin already exists');
    }

    // Sample products
    const products = [
      ['Wireless Headphones','High-quality Bluetooth headphones.',1999.99,10,'/images/headphone.jpg','electronics'],
      ['Smartwatch Pro','Fitness tracking smartwatch.',1499.50,15,'/images/watch.jpg','electronics'],
      ['Cotton T-Shirt','Comfortable cotton t-shirt.',499.00,50,'/images/tshirt.jpg','fashion'],
      // add more as needed
    ];
    for (const p of products) {
      const [rows] = await pool.query('SELECT id FROM products WHERE title = ?', [p[0]]);
      if (!rows.length) {
        await pool.query('INSERT INTO products (title,description,price,stock,image_url,category) VALUES (?,?,?,?,?,?)', p);
      }
    }
    console.log('Seed complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
