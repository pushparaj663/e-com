// syncProducts.js
const Stripe = require("stripe");
const mysql = require("mysql2/promise");

const stripe = new Stripe("sk_test_51Rysk01QHSw2U7iXyLhuQLoyCzNH1gbSdZIqeOaFsUFL8E2aRThBttQc8HRXmkyGFZKVMIAJL9U8bXo40Qif8cDc00JT3QiWKk");

// ✅ DB connection config
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "014009009", // put your MySQL password
  database: "ecommerce",
};

async function syncProducts() {
  const db = await mysql.createConnection(dbConfig);

  try {
    // Fetch products that are not synced
    const [products] = await db.query(
      "SELECT * FROM products WHERE stripe_product_id IS NULL OR stripe_price_id IS NULL"
    );

    if (products.length === 0) {
      console.log("✅ All products already synced with Stripe!");
      return;
    }

    for (const product of products) {
      console.log(`➡️ Syncing product ID: ${product.id}`);

      // ✅ Use title instead of name
      const productName = product.title && product.title.trim() !== ""
        ? product.title
        : `Product ${product.id}`;
      const productDescription = product.description || "No description provided";
      const productPrice = product.price ? Math.round(product.price * 100) : 100; // default ₹1 if price missing

      // 1️⃣ Create product in Stripe
      const stripeProduct = await stripe.products.create({
        name: productName,
        description: productDescription,
      });

      // 2️⃣ Create recurring price in Stripe
      const stripePrice = await stripe.prices.create({
        unit_amount: productPrice,
        currency: "inr",
        recurring: { interval: "month" }, // for subscriptions
        product: stripeProduct.id,
      });

      // 3️⃣ Save IDs back to DB
      await db.query(
        "UPDATE products SET stripe_product_id = ?, stripe_price_id = ? WHERE id = ?",
        [stripeProduct.id, stripePrice.id, product.id]
      );

      console.log(
        `✅ Synced: ${productName} → ${stripeProduct.id} / ${stripePrice.id}`
      );
    }

    console.log("🎉 Bulk sync complete!");
  } catch (err) {
    console.error("❌ Sync failed:", err);
  } finally {
    await db.end();
    process.exit(0);
  }
}

syncProducts();
