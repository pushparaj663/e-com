const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET);
const bodyParser = require("body-parser");

// NOTE: raw body is required only for webhooks
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"],
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ----------------- HANDLE EVENTS -----------------
    switch (event.type) {
      case "payment_intent.succeeded":
        console.log("💰 Payment Succeeded:", event.data.object.id);
        break;

      case "payment_intent.payment_failed":
        console.log("❌ Payment Failed:", event.data.object.id);
        break;

      case "setup_intent.succeeded":
        console.log("💳 Card Saved Successfully:", event.data.object.payment_method);
        break;

      case "invoice.payment_succeeded":
        console.log("📦 Subscription Payment Success");
        break;

      case "invoice.payment_failed":
        console.log("⚠️ Subscription Payment Failed");
        break;

      case "customer.subscription.created":
        console.log("🏷️ Subscription Created");
        break;

      case "customer.subscription.updated":
        console.log("🔄 Subscription Updated");
        break;

      case "customer.subscription.deleted":
        console.log("❌ Subscription Cancelled");
        break;

      default:
        console.log("Unhandled event:", event.type);
    }

    res.sendStatus(200);
  }
);

module.exports = router;
