// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const SECRET = "default_secret"; // SAME AS in auth.js

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = { id: decoded.id }; // ensure user id exists
    next();
  } catch (err) {
    console.log("JWT ERROR:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = { verifyToken, SECRET };
