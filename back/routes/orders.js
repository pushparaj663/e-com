// backend/routes/orders.js
const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
  try {
    const { items, totalPrice } = req.body; // items: [{productId, quantity, price}]
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [orderResult] = await conn.query('INSERT INTO orders (user_id, total_price, status) VALUES (?,?,?)', [req.user.id, totalPrice, 'pending']);
      const orderId = orderResult.insertId;
      const orderItemsPromises = items.map(i =>
        conn.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?,?,?,?)', [orderId, i.productId, i.quantity, i.price])
      );
      await Promise.all(orderItemsPromises);
      // Clear cart
      await conn.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
      await conn.commit();
      res.json({ orderId });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

// Get user's orders
router.get('/', verifyToken, async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE user_id = ?', [req.user.id]);
    res.json(orders);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
