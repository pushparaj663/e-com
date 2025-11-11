// backend/server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");
const paymentRoutes = require("./routes/payment");
const subscriptionRoutes = require("./routes/subscription");
const app = express();
app.use(cors());

// ---------------- Normal JSON routes ----------------
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", paymentRoutes);
app.use("/api/subscription", subscriptionRoutes);

app.get("/", (req, res) => {
  res.send("✅ Stripe Payment API is running");
});


const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
