// routes/subscriptionRoutes.js
const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET);
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

// Convert rupees → paise
const toPaise = (r) => Math.round(Number(r) * 100);

/* ---------------------------------------------------------
   1) CREATE EMI (First Payment + SetupIntent)
----------------------------------------------------------*/
router.post("/create-emi", verifyToken, async (req, res) => {
  try {
    const { totalAmount, months } = req.body; // totalAmount in paise
    const userId = req.user.id;

    if (!totalAmount || totalAmount < 1)
      return res.status(400).json({ error: "Invalid amount" });

    if (!months || months < 1)
      return res.status(400).json({ error: "Invalid EMI months" });

    const monthlyAmount = Math.round(Number(totalAmount) / Number(months));

    // Stripe minimum limit: 50 INR per charge (5000 paise)
    if (monthlyAmount < 5000) {
      return res.status(400).json({
        error: "Monthly EMI must be at least ₹50. Reduce EMI months."
      });
    }

    // Fetch user
    const [userRows] = await db.query(
      "SELECT id, name, email, stripe_customer_id FROM users WHERE id = ?",
      [userId]
    );

    if (!userRows.length)
      return res.status(404).json({ error: "User not found" });

    const user = userRows[0];
    let customerId = user.stripe_customer_id;

    // Create Stripe customer if missing
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: user.name,
        email: user.email,
        metadata: { userId }
      });
      customerId = customer.id;

      await db.query(
        "UPDATE users SET stripe_customer_id = ? WHERE id = ?",
        [customerId, userId]
      );
    } else {
      // Ensure Stripe customer is up to date
      await stripe.customers.update(customerId, {
        name: user.name,
        email: user.email
      });
    }

    // First EMI payment (PaymentIntent)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: monthlyAmount,
      currency: "inr",
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: { userId, emi: "first_payment" }
    });

    // SetupIntent — save card for future off-session payments
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session"
    });

    // Save EMI plan in DB
    const [emiRes] = await db.query(
      `INSERT INTO emi_plans 
        (user_id, total_amount_paise, monthly_amount_paise, months_total, months_left, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, totalAmount, monthlyAmount, months, months]
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      setupClientSecret: setupIntent.client_secret,
      monthlyAmount,
      emiId: emiRes.insertId
    });
  } catch (err) {
    console.error("create-emi ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------------------------------------------------
   2) ATTACH PAYMENT METHOD (After confirmCardSetup)
----------------------------------------------------------*/
router.post("/attach-payment-method", verifyToken, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const userId = req.user.id;

    if (!paymentMethodId)
      return res.status(400).json({ error: "Missing paymentMethodId" });

    // Fetch customer
    const [userRows] = await db.query(
      "SELECT stripe_customer_id FROM users WHERE id = ?",
      [userId]
    );

    if (!userRows.length)
      return res.status(404).json({ error: "User not found" });

    const customerId = userRows[0].stripe_customer_id;

    if (!customerId)
      return res
        .status(400)
        .json({ error: "Stripe customer ID missing for user" });

    // Attach card
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });

    // Set default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("attach-payment-method ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------------------------------------------------
   3) SAVE PAYMENT + ORDER (After successful first EMI)
----------------------------------------------------------*/
router.post("/save-payment", verifyToken, async (req, res) => {
  try {
    const {
      paymentId,
      amount,
      currency,
      status,
      cartItems,
      emiId
    } = req.body;

    const userId = req.user.id;

    if (!paymentId)
      return res.status(400).json({ error: "Missing paymentId" });

    // Create order
    const [orderRes] = await db.query(
      `INSERT INTO orders 
        (user_id, total_price, status, subscription_id, emi_id, created_at, order_date, order_time)
       VALUES (?, ?, ?, NULL, ?, NOW(), CURDATE(), CURTIME())`,
      [
        userId,
        amount ? amount / 100 : 0,
        status || "pending",
        emiId || null
      ]
    );

    const orderId = orderRes.insertId;

    // Insert order items
    if (Array.isArray(cartItems) && cartItems.length > 0) {
      await Promise.all(
        cartItems.map((item) =>
          db.query(
            "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
            [orderId, item.id, item.quantity, item.price]
          )
        )
      );
    }

    // Insert payment record
    await db.query(
      `INSERT INTO payments 
        (payment_id, amount, currency, status, user_id, order_id, emi_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        paymentId,
        amount / 100,
        currency,
        status,
        userId,
        orderId,
        emiId || null
      ]
    );

    res.json({ success: true, orderId, emiId });
  } catch (err) {
    console.error("save-payment ERROR:", err);
    res.status(500).json({ error: "Failed to save payment/order" });
  }
});

/* ---------------------------------------------------------
   4) PAY MONTHLY INSTALLMENT (Cron or manual)
----------------------------------------------------------*/
router.post("/pay-installment", async (req, res) => {
  try {
    const { emiId } = req.body;

    if (!emiId)
      return res.status(400).json({ error: "Missing emiId" });

    const [rows] = await db.query(
      "SELECT * FROM emi_plans WHERE id = ?",
      [emiId]
    );

    if (!rows.length)
      return res.status(404).json({ error: "EMI plan not found" });

    const emi = rows[0];

    if (emi.months_left <= 0)
      return res.json({ success: true, message: "EMI completed" });

    const [uRows] = await db.query(
      "SELECT stripe_customer_id FROM users WHERE id = ?",
      [emi.user_id]
    );

    if (!uRows.length)
      return res.status(404).json({ error: "User not found" });

    const customerId = uRows[0].stripe_customer_id;

    const customer = await stripe.customers.retrieve(customerId);
    let paymentMethod = customer?.invoice_settings?.default_payment_method;

    // Fallback to first saved card
    if (!paymentMethod) {
      const pmList = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
        limit: 1
      });

      if (pmList.data?.length > 0)
        paymentMethod = pmList.data[0].id;
    }

    if (!paymentMethod)
      return res.status(400).json({ error: "No saved payment method" });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: emi.monthly_amount_paise,
      currency: "inr",
      customer: customerId,
      payment_method: paymentMethod,
      confirm: true,
      off_session: true,
      metadata: { emiId, type: "monthly_installment" }
    });

    // Update EMI record
    await db.query(
      "UPDATE emi_plans SET months_left = months_left - 1, last_payment_at = NOW() WHERE id = ?",
      [emiId]
    );

    // Save payment
    await db.query(
      `INSERT INTO payments 
        (payment_id, amount, currency, status, user_id, emi_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        paymentIntent.id,
        paymentIntent.amount / 100,
        paymentIntent.currency,
        paymentIntent.status,
        emi.user_id,
        emiId
      ]
    );

    // Mark EMI as completed
    const [check] = await db.query(
      "SELECT months_left FROM emi_plans WHERE id = ?",
      [emiId]
    );

    if (check[0].months_left <= 0) {
      await db.query(
        "UPDATE emi_plans SET completed = 1 WHERE id = ?",
        [emiId]
      );
    }

    res.json({ success: true, paymentIntent });
  } catch (err) {
    console.error("pay-installment ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------------------------------------------------
   5) List pending EMI
----------------------------------------------------------*/
router.get("/pending-emi", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM emi_plans WHERE months_left > 0"
    );
    res.json(rows);
  } catch (err) {
    console.error("pending-emi ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
/* ---------------------------------------------------------
   6) CREATE RECURRING SUBSCRIPTION (Monthly/Yearly)
----------------------------------------------------------*/
router.post("/create-recurring", verifyToken, async (req, res) => {
  try {
    const { priceId } = req.body;
    const userId = req.user.id;

    if (!priceId)
      return res.status(400).json({ error: "Missing priceId" });

    // Get user
    const [userRows] = await db.query(
      "SELECT name, email, stripe_customer_id FROM users WHERE id = ?",
      [userId]
    );
    if (!userRows.length) return res.status(404).json({ error: "User not found" });

    const user = userRows[0];
    let customerId = user.stripe_customer_id;

    // Create Stripe customer if not exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: user.name,
        email: user.email,
        metadata: { userId }
      });

      customerId = customer.id;

      await db.query(
        "UPDATE users SET stripe_customer_id = ? WHERE id = ?",
        [customerId, userId]
      );
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"]
    });

    const clientSecret = subscription.latest_invoice.payment_intent.client_secret;

    // Save subscription in DB
    await db.query(
      `INSERT INTO subscriptions (subscription_id, user_id, status, created_at)
       VALUES (?, ?, ?, NOW())`,
      [subscription.id, userId, subscription.status]
    );

    res.json({
      success: true,
      subscriptionId: subscription.id,
      clientSecret
    });

  } catch (err) {
    console.error("create-recurring ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


/* ---------------------------------------------------------
   7) CANCEL SUBSCRIPTION
----------------------------------------------------------*/
router.post("/cancel-subscription", verifyToken, async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId)
      return res.status(400).json({ error: "Missing subscriptionId" });

    // Cancel subscription in Stripe
    const deleted = await stripe.subscriptions.del(subscriptionId);

    // Mark as cancelled in DB
    await db.query(
      "UPDATE subscriptions SET status = ? WHERE subscription_id = ?",
      ["canceled", subscriptionId]
    );

    res.json({ success: true, deleted });
  } catch (err) {
    console.error("cancel-subscription ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


/* ---------------------------------------------------------
   8) GET USER SUBSCRIPTIONS
----------------------------------------------------------*/
router.get("/my-subscriptions", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [subs] = await db.query(
      `SELECT subscription_id, status, created_at 
       FROM subscriptions 
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(subs);
  } catch (err) {
    console.error("my-subscriptions ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
