const { CronJob } = require("cron");

const job = new CronJob("*/5 * * * * *", () => {
  console.log("Hello Raju! Running every 5 seconds");
});

job.start();
