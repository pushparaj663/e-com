// backend/server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/payment", require("./routes/paymentRoutes"));  // ✅ Only once

app.get("/", (req, res) => {
  res.send("Server working with Razorpay");
});

app.listen(process.env.PORT || 5000, () =>
  console.log("Server running")
);
