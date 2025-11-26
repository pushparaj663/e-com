// backend/routes/cart.js
const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Get cart for logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id AS cartId, c.quantity, p.* FROM cart c
       JOIN products p ON c.product_id = p.id WHERE c.user_id = ?`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Add or update cart item
router.post('/', verifyToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    // check existing
    const [existing] = await pool.query('SELECT id,quantity FROM cart WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
    if (existing.length) {
      const newQty = existing[0].quantity + quantity;
      await pool.query('UPDATE cart SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
    } else {
      await pool.query('INSERT INTO cart (user_id, product_id, quantity) VALUES (?,?,?)', [req.user.id, productId, quantity]);
    }
    const [rows] = await pool.query(
      `SELECT c.id AS cartId, c.quantity, p.* FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Update quantity
router.put('/:cartId', verifyToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    const { cartId } = req.params;
    await pool.query('UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, cartId, req.user.id]);
    const [rows] = await pool.query(`SELECT c.id AS cartId, c.quantity, p.* FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?`, [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Remove item
router.delete('/:cartId', verifyToken, async (req, res) => {
  try {
    const { cartId } = req.params;
    await pool.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [cartId, req.user.id]);
    const [rows] = await pool.query(`SELECT c.id AS cartId, c.quantity, p.* FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?`, [req.user.id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;