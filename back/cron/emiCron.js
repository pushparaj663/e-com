// cron/emiCron.js

const cron = require("node-cron");
const axios = require("axios");

cron.schedule("0 0 1 * *", async () => {
  console.log("🔥 EMI Cron Started");

  try {
    const res = await axios.get("http://localhost:5000/api/subscription/pending-emi");
    const emiList = res.data;

    for (const emi of emiList) {
      console.log("Charging EMI for plan ID:", emi.id);

      await axios.post("http://localhost:5000/api/subscription/pay-installment", {
        emiId: emi.id,
      });
    }
  } catch (err) {
    console.error("EMI Cron ERROR:", err.message);
  }
});
