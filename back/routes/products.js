// backend/routes/products.js
const express = require("express");
const pool = require("../db"); // make sure this is your MySQL pool

const router = express.Router();

// List active products (with optional search & category)
router.get("/", async (req, res) => {
  try {
    const { q, category } = req.query;
    let sql = "SELECT * FROM products WHERE active = true";
    const params = [];

    if (q) {
      sql += " AND title LIKE ?";
      params.push(`%${q}%`);
    }

    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single active product
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM products WHERE id = ? AND active = true",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Product not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get subscription price for a product
router.get("/:id/price/:period", async (req, res) => {
  try {
    const { id, period } = req.params; // id = productId, period = monthly/yearly

    const [rows] = await pool.query(
      "SELECT stripe_monthly_price_id, stripe_yearly_price_id FROM products WHERE id = ?",
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: "Product not found" });

    const priceId = period === "monthly"
      ? rows[0].stripe_monthly_price_id
      : rows[0].stripe_yearly_price_id;

    if (!priceId) return res.status(404).json({ error: "Price not set for this period" });

    res.json({ priceId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch price" });
  }
});

module.exports = router;
