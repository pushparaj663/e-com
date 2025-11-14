const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ----------------------------------------------------
// 1) CREATE ORDER
// ----------------------------------------------------
router.post("/create-order", verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100, // INR → paise
      currency: "INR",
      receipt: "order_rcptid_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (err) {
    console.error("Razorpay Order Error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// ----------------------------------------------------
// 2) VERIFY PAYMENT
// ----------------------------------------------------
router.post("/verify-payment", verifyToken, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // Save Order
    const [orderRes] = await db.query(
      `INSERT INTO orders 
       (user_id, total_price, status, payment_id, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        req.user.id,
        orderData.amount,
        "paid",
        razorpay_payment_id,
      ]
    );

    const orderId = orderRes.insertId;

    // Save order items
    if (orderData.cartItems.length > 0) {
      await Promise.all(
        orderData.cartItems.map((item) =>
          db.query(
            "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
            [orderId, item.id, item.quantity, item.price]
          )
        )
      );
    }

    res.json({ success: true, orderId });
  } catch (err) {
    console.error("Verify Error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

module.exports = router;
