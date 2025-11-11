const express = require("express");
const Stripe = require("stripe");
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();
const stripe = new Stripe("sk_test_51Rysk01QHSw2U7iXyLhuQLoyCzNH1gbSdZIqeOaFsUFL8E2aRThBttQc8HRXmkyGFZKVMIAJL9U8bXo40Qif8cDc00JT3QiWKk");

/**
 * ✅ Create Subscription (EMI / recurring payments)
 */
// ---------------- Create Subscription ----------------
router.post("/create-subscription", verifyToken, async (req, res) => {
  try {
    const { priceId } = req.body;
    const userId = req.user.id;

    // Check if user has Stripe customer
    const [rows] = await db.query("SELECT stripe_customer_id FROM users WHERE id = ?", [userId]);
    let customerId = rows[0]?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: { userId }
      });
      customerId = customer.id;
      await db.query("UPDATE users SET stripe_customer_id = ? WHERE id = ?", [customerId, userId]);
    }

    // Create subscription in Stripe
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"]
    });

    const paymentIntent = subscription.latest_invoice.payment_intent;

    // Save subscription in DB
    await db.query(
      `INSERT INTO subscriptions (subscription_id, user_id, price_id, status, created_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [subscription.id, userId, priceId, subscription.status]
    );

    res.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount
    });
  } catch (err) {
    console.error("Subscription create error:", err);
    res.status(500).json({ error: "Subscription creation failed" });
  }
});

// ---------------- Get EMI Plans for a Product ----------------
router.get("/product/:id/emi-plans", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT emi_plans FROM products WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Product not found" });
    res.json(JSON.parse(rows[0].emi_plans || "[]"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch EMI plans" });
  }
});

/**
 * ✅ Get My Subscriptions
 */
router.get("/my-subscriptions", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [subs] = await db.query(`
      SELECT s.subscription_id, s.period, s.status, s.created_at,
        JSON_ARRAYAGG(JSON_OBJECT('title', p.title, 'quantity', oi.quantity, 'price', oi.price)) AS items
      FROM subscriptions s
      LEFT JOIN orders o ON o.id = s.order_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE s.user_id = ?
      GROUP BY s.subscription_id
      ORDER BY s.created_at DESC
    `, [userId]);

    res.json(subs);
  } catch (err) {
    console.error("Fetch subscriptions error:", err);
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
});

module.exports = router;
