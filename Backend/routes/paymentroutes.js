// routes/paymentRoutes.js
const express = require("express");
const Stripe = require("stripe");
const db = require("../db");

const router = express.Router();
const stripe = new Stripe("sk_test_51Rysk01QHSw2U7iXyLhuQLoyCzNH1gbSdZIqeOaFsUFL8E2aRThBttQc8HRXmkyGFZKVMIAJL9U8bXo40Qif8cDc00JT3QiWKk"); // secret key

const endpointSecret = "whsec_5ce3bacc480243e7d1a052c0ed04649ab23e858694f69128e84775f1307b1cf1"; // 👈 your webhook secret

// Stripe webhook handler
router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        await db.query(
          "UPDATE subscriptions SET status = ?, current_period_end = FROM_UNIXTIME(?) WHERE stripe_subscription_id = ?",
          ["active", invoice.lines.data[0].period.end, subscriptionId]
        );
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        await db.query(
          "UPDATE subscriptions SET status = ?, current_period_end = FROM_UNIXTIME(?) WHERE stripe_subscription_id = ?",
          [subscription.status, subscription.current_period_end, subscription.id]
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await db.query(
          "UPDATE subscriptions SET status = ? WHERE stripe_subscription_id = ?",
          ["canceled", subscription.id]
        );
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error("❌ DB update error:", err);
    res.status(500).send("Webhook handler failed");
  }
});

module.exports = router;
