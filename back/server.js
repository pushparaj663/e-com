// backend/server.js

// 1️⃣ Load environment variables FIRST
require("dotenv").config();

// 2️⃣ Load Stripe EMI Cron (optional)
require("./cron/emiCron");

const express = require("express");
const cors = require("cors");
const app = express();

// 3️⃣ Stripe Webhook MUST use raw body (before express.json)
const webhookRoutes = require("./routes/webhookRoutes");
app.use("/webhook", webhookRoutes);

// 4️⃣ Normal JSON body for all other routes
app.use(cors());
app.use(express.json());

// 👉 ROUTES
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");

// Stripe Payments (normal one-time payments)
const paymentRoutes = require("./routes/payment");

// Stripe Subscriptions + EMI
const subscriptionRoutes = require("./routes/subscriptionRoutes");

// 5️⃣ Mount API paths
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

// Stripe Payment Intent (Card)
app.use("/api", paymentRoutes);

// Stripe EMI + Stripe Subscription APIs
app.use("/api/subscription", subscriptionRoutes);

// Debug route
app.get("/", (req, res) => {
  res.send("🔥 Stripe Payment API is running (Server OK)");
});

// Start
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
