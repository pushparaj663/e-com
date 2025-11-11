const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../middleware/auth");

async function register(req, res) {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Missing fields" });

  const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
  if (rows.length) return res.status(400).json({ message: "Email already exists" });

  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    "INSERT INTO users (name,email,password) VALUES (?,?,?)",
    [name || "", email, hash]
  );

  const user = { id: result.insertId, name, email, isAdmin: false };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.json({ token, user });
}

async function login(req, res) {
  const { email, password } = req.body;
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  if (!rows.length) return res.status(400).json({ message: "Invalid credentials" });

  const userRow = rows[0];
  const ok = await bcrypt.compare(password, userRow.password);
  if (!ok) return res.status(400).json({ message: "Invalid credentials" });

  const user = { id: userRow.id, name: userRow.name, email: userRow.email, isAdmin: !!userRow.isAdmin };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.json({ token, user });
}

module.exports = { register, login };
