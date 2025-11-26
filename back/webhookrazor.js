const axios = require("axios");

const key_id = "rzp_test_Rgh0l6uEoclw3z";       // your Razorpay Key ID
const key_secret = "r0p7HYzcbrtg0ZuXG7rNOPAP";  // your Razorpay Secret Key

async function createWebhook() {
  try {
    const response = await axios.post(
      "https://api.razorpay.com/v1/webhooks",
      {
        url: "https://liane-knobbiest-nonethnically.ngrok-free.dev", // webhook URL
        active: true,
        events: {
          "payment.captured": true,
          "payment.failed": true,
          "order.paid": true
        },
        secret: "my_webhook_secret_123", // your webhook secret
      },
      {
        auth: {
          username: key_id,
          password: key_secret,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Webhook Created Successfully:");
    console.log(response.data);

  } catch (error) {
    console.log("❌ Webhook Creation Failed:");
    console.log(error.response?.data || error.message);
  }
}

createWebhook();
