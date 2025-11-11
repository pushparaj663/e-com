const Stripe = require("stripe");
const db = require("./db"); // your MySQL connection

const stripe = new Stripe("sk_test_51Rysk01QHSw2U7iXyLhuQLoyCzNH1gbSdZIqeOaFsUFL8E2aRThBttQc8HRXmkyGFZKVMIAJL9U8bXo40Qif8cDc00JT3QiWKk"); // replace with your key

async function syncPrices() {
  try {
    const [products] = await db.query("SELECT * FROM products");

    for (const product of products) {
      console.log(`Processing product: ${product.id} - ${product.title}`);

      // Skip if prices already exist
      if (product.stripe_price_id_monthly && product.stripe_price_id_yearly) {
        console.log("Stripe prices already exist. Skipping.");
        continue;
      }

      // ----------------- CREATE MONTHLY PRICE -----------------
      const monthlyPrice = await stripe.prices.create({
        unit_amount: Math.round(product.price * 100), // convert rupees to paise
        currency: "inr",
        recurring: { interval: "month" },
        product_data: { name: product.title },
      });

      // ----------------- CREATE YEARLY PRICE -----------------
      const yearlyPrice = await stripe.prices.create({
        unit_amount: Math.round(product.price * 100) * 12, // yearly = 12 * monthly
        currency: "inr",
        recurring: { interval: "year" },
        product_data: { name: product.title },
      });

      // ----------------- UPDATE DATABASE -----------------
      await db.query(
        `UPDATE products SET stripe_price_id_monthly = ?, stripe_price_id_yearly = ? WHERE id = ?`,
        [monthlyPrice.id, yearlyPrice.id, product.id]
      );

      console.log(`✅ Updated product ${product.id} with Stripe Price IDs`);
    }

    console.log("All products synced with Stripe prices!");
    process.exit(0);
  } catch (err) {
    console.error("Error syncing prices:", err);
    process.exit(1);
  }
}

syncPrices();
