// backend/routes/auth.js

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

// ✅ Import verifyToken correctly
const { verifyToken } = require("../middleware/authMiddleware");

// If your middleware does NOT export SECRET, use environment variable
const SECRET = process.env.JWT_SECRET || "default_secret";

const router = express.Router();

// ---------------- REGISTER ----------------
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const [rows] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (rows.length)
      return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashed, "user"]
    );

    const user = {
      id: result.insertId,
      name,
      email,
      role: "user",
    };

    const token = jwt.sign(user, SECRET, { expiresIn: "7d" });

    res.json({ user, token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- LOGIN ----------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      "SELECT id, name, email, password, role FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length)
      return res.status(400).json({ message: "Invalid credentials" });

    const userRow = rows[0];

    const match = await bcrypt.compare(password, userRow.password);
    if (!match)
      return res.status(400).json({ message: "Invalid credentials" });

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
    };

    const token = jwt.sign(user, SECRET, { expiresIn: "7d" });

    res.json({ user, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET logged in user
router.get("/me", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("auth/me error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

module.exports = router;
