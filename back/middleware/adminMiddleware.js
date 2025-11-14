// backend/middleware/adminMiddleware.js
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin access required' });
}

module.exports = requireAdmin;
