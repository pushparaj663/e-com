const express = require("express");
const pool = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

const router = express.Router();

/* ---------------------- PRODUCTS ---------------------- */
router.get("/products", verifyToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/products", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, price, stock, image_url, category } = req.body;
    const [result] = await pool.query(
      `INSERT INTO products (title, description, price, stock, image_url, category, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, true, NOW())`,
      [title, description, price, stock, image_url, category]
    );
    res.json({ id: result.insertId, message: "Product created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/products/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const fields = { ...req.body };
    delete fields.created_at;

    const keys = Object.keys(fields);
    if (!keys.length) return res.status(400).json({ message: "No fields to update" });

    const set = keys.map(k => `${k} = ?`).join(", ");
    const values = keys.map(k => fields[k]);

    await pool.query(`UPDATE products SET ${set} WHERE id = ?`, [...values, id]);
    res.json({ message: "Product updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/products/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/products/:id/toggle", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    await pool.query("UPDATE products SET active = ? WHERE id = ?", [active, id]);
    res.json({ message: `Product ${active ? "activated" : "deactivated"}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------- USERS ---------------------- */
router.get("/users", verifyToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, email, role, active FROM users");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/users/:id/toggle", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    await pool.query("UPDATE users SET active = ? WHERE id = ?", [active, id]);
    res.json({ message: `User ${active ? "activated" : "deactivated"}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to toggle user" });
  }
});

router.delete("/users/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id=?", [req.params.id]);
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

/* ---------------------- ORDERS ---------------------- */
router.get("/orders", verifyToken, requireAdmin, async (req, res) => {
  try {
    // Fetch all orders with user info
    const [orders] = await pool.query(`
      SELECT 
        o.id AS orderId,
        o.user_id,
        o.total_price AS total,
        o.status AS order_status,
        o.created_at,
        u.name AS userName
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    // For each order, fetch order items
    for (const order of orders) {
      const [items] = await pool.query(`
        SELECT 
          oi.id, 
          oi.product_id, 
          oi.quantity, 
          oi.price, 
          p.title
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.orderId]);
      order.items = items;

      // Fetch payment info if exists
      const [payment] = await pool.query(`
        SELECT payment_id, amount, currency, status, payment_method
        FROM payments
        WHERE order_id = ?
        LIMIT 1
      `, [order.orderId]);

      order.payment_id = payment[0]?.payment_id || null;
      order.payment_amount = payment[0]?.amount || null;
      order.currency = payment[0]?.currency || "INR";
      order.payment_status = payment[0]?.status || null;
      order.payment_method = payment[0]?.payment_method || "COD";
    }

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update order status
router.put("/orders/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query("UPDATE orders SET status=? WHERE id=?", [status, id]);
    res.json({ message: "Order status updated" });
  } catch (err) {
    console.error("Failed to update order:", err);
    res.status(500).json({ message: "Failed to update order" });
  }
});

router.post("/save-payment", verifyToken, async (req, res) => {
  try {
    const { paymentId, amount, currency, status, userId, cartItems, name, email, phone } = req.body;

    // 1️⃣ Create order first
    const [orderResult] = await pool.query(
      `INSERT INTO orders (user_id, total_price, status, created_at)
       VALUES (?, ?, 'pending', NOW())`,
      [userId, amount / 100] // convert paise to rupees
    );
    const orderId = orderResult.insertId;

    // 2️⃣ Insert order items
    for (const item of cartItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.id, item.quantity, item.price]
      );
    }

    // 3️⃣ Insert payment and link to order
    await pool.query(
      `INSERT INTO payments (order_id, payment_id, payment_method, amount, currency, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [orderId, paymentId, "card", amount, currency, status]
    );

    res.json({ message: "Order and payment saved successfully", orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save payment/order" });
  }
});

module.exports = router;
