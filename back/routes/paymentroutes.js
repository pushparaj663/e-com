const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// 🟢 Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// 1️⃣ CREATE ORDER (from frontend)
router.post("/razorpay/create", verifyToken, async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // convert INR → paisa
    currency: "INR",
    receipt: "receipt_" + Date.now(),
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (err) {
    console.error("Razorpay Create Error:", err);
    res.status(500).json({ success: false, message: "Order creation failed" });
  }
});

// 2️⃣ VERIFY PAYMENT
router.post("/razorpay/verify", verifyToken, async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    cartItems,
    amount
  } = req.body;

  const userId = req.user.id;

  // Signature check
  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(sign)
    .digest("hex");

  if (expectedSign !== razorpay_signature) {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  try {
    // Save order
    const [orderRes] = await db.query(
      `INSERT INTO orders (user_id, total_price, status, created_at)
       VALUES (?, ?, ?, NOW())`,
      [userId, amount, "paid"]
    );

    const newOrderId = orderRes.insertId;

    // Save order items
    await Promise.all(
      cartItems.map((item) =>
        db.query(
          "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
          [newOrderId, item.id, item.quantity, item.price]
        )
      )
    );

    // Save payment log
    await db.query(
      `INSERT INTO payments
      (payment_id, amount, currency, status, user_id, order_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [razorpay_payment_id, amount, "INR", "paid", userId, newOrderId]
    );

    res.json({ success: true, orderId: newOrderId });
  } catch (err) {
    console.error("Verify Error:", err);
    res.status(500).json({ success: false, message: "Payment verify failed" });
  }
});

module.exports = router;
