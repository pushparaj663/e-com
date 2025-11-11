const express = require("express");
const Stripe = require("stripe");
const db = require("../db"); // MySQL connection
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();
const stripe = new Stripe("sk_test_51Rysk01QHSw2U7iXyLhuQLoyCzNH1gbSdZIqeOaFsUFL8E2aRThBttQc8HRXmkyGFZKVMIAJL9U8bXo40Qif8cDc00JT3QiWKk");

// ---------------- Create Payment Intent (One-time) ----------------
router.post("/create-payment-intent", verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ error: "Invalid amount" });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: "inr",
      automatic_payment_methods: { enabled: true },
      metadata: { userId: req.user.id },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- Save Payment & Order ----------------
router.post("/save-payment", verifyToken, async (req, res) => {
  try {
    const { paymentId, amount, currency, status, cartItems, subscriptionId, period } = req.body;
    const userId = req.user.id;

    if ((!cartItems || cartItems.length === 0) && !subscriptionId)
      return res.status(400).json({ error: "Cart or subscription required" });

    // 1️⃣ Save order
    const [orderResult] = await db.query(
      `INSERT INTO orders (user_id, total_price, status, created_at) VALUES (?, ?, ?, NOW())`,
      [userId, amount ? amount / 100 : 0, status || "pending"]
    );
    const orderId = orderResult.insertId;

    // 2️⃣ Save order items if exists
    if (cartItems && cartItems.length > 0) {
      const itemsPromises = cartItems.map(item =>
        db.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
          [orderId, item.id, item.quantity, item.price]
        )
      );
      await Promise.all(itemsPromises);
    }

    // 3️⃣ Save payment if exists
    if (paymentId) {
      await db.query(
        `INSERT INTO payments (payment_id, amount, currency, status, user_id, order_id, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [paymentId, amount / 100, currency, status, userId, orderId]
      );
    }

    // 4️⃣ Save subscription if exists
    if (subscriptionId) {
      await db.query(
        `INSERT INTO subscriptions (subscription_id, user_id, order_id, period, status, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [subscriptionId, userId, orderId, period || "monthly", status || "active"]
      );
    }

    res.json({ success: true, orderId, subscriptionId });
  } catch (err) {
    console.error("Error saving order/payment:", err);
    res.status(500).json({ error: "Failed to save payment/order" });
  }
});

// ----------------- SUBSCRIPTION -----------------
router.get("/subscription/product/:id/price/:period", verifyToken, async (req, res) => {
  try {
    const productId = req.params.id;
    const period = req.params.period; // monthly/yearly
    const [rows] = await db.query(
      `SELECT stripe_price_id_monthly, stripe_price_id_yearly FROM products WHERE id = ?`,
      [productId]
    );
    if (!rows.length) return res.status(404).json({ error: "Product not found" });

    const priceId = period === "monthly" ? rows[0].stripe_price_id_monthly : rows[0].stripe_price_id_yearly;
    if (!priceId) return res.status(400).json({ error: "Price ID not found" });

    res.json({ priceId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/subscription/create-subscription", verifyToken, async (req, res) => {
  try {
    const { priceId } = req.body;
    const userId = req.user.id;

    if (!priceId) return res.status(400).json({ error: "Missing priceId" });

    // 1️⃣ Get user from DB
    const [userRows] = await db.query(
      "SELECT name, email, stripe_customer_id FROM users WHERE id = ?",
      [userId]
    );
    if (!userRows.length) return res.status(404).json({ error: "User not found" });

    const user = userRows[0];
    let customerId = user.stripe_customer_id;

    // 2️⃣ Create Stripe customer if not exists OR update name/email if missing
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: user.name,
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;

      await db.query(
        "UPDATE users SET stripe_customer_id = ? WHERE id = ?",
        [customerId, userId]
      );
    } else {
      // Update existing customer with name/email if missing
      await stripe.customers.update(customerId, {
        name: user.name,
        email: user.email,
      });
    }

    // 3️⃣ Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    const clientSecret = subscription.latest_invoice.payment_intent?.client_secret || null;

    // 4️⃣ Save subscription in DB
    await db.query(
      `INSERT INTO subscriptions (subscription_id, user_id, order_id, period, status, created_at)
       VALUES (?, ?, NULL, ?, ?, NOW())`,
      [subscription.id, userId, "monthly", subscription.status]
    );

    res.json({
      subscriptionId: subscription.id,
      clientSecret,
      status: subscription.status,
    });

  } catch (err) {
    console.error("Stripe subscription error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- Get User Subscriptions ----------------
router.get("/my-subscriptions", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [subs] = await db.query(`
      SELECT s.subscription_id, s.period, s.status, s.amount,
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
    console.error(err);
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
});

module.exports = router;
