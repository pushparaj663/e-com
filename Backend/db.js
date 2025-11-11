// backend/db.js
const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root",      // <-- change if your MySQL user is different
  password: "014009009",      // <-- put your MySQL password if any
  database: "ecommerce"
});

module.exports = db;
