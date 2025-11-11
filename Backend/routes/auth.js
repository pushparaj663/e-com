// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { SECRET } = require('../middleware/authMiddleware');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)', [name, email, hashed, 'user']);
    const user = { id: result.insertId, name, email, role: 'user' };
    const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT id,name,email,password,role FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(400).json({ message: 'Invalid credentials' });

    const userRow = rows[0];
    const match = await bcrypt.compare(password, userRow.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const user = { id: userRow.id, name: userRow.name, email: userRow.email, role: userRow.role };
    const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
