const axios = require('axios');
const mysql = require('mysql2/promise');

async function main() {
  try {
    // 1. Connect to MySQL
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',          // your MySQL username
      password: '014009009',          // your MySQL password
      database: 'ecommerce',   // your database name
    });

    console.log('Connected to MySQL');

    // 2. Fetch products from FakeStoreAPI
    const response = await axios.get('https://fakestoreapi.com/products');
    const products = response.data;

    // 3. Insert products into database with random stock
    for (const p of products) {
      const stock = Math.floor(Math.random() * 50) + 1; // random stock 1-50
      await connection.execute(
        `INSERT INTO products (title, description, price, category, image_url, stock)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [p.title, p.description, p.price, p.category, p.image, stock]
      );
      console.log(`Inserted: ${p.title} (Stock: ${stock})`);
    }

    console.log('All products inserted successfully!');
    await connection.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
