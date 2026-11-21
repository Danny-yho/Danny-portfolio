const jwt = require('jsonwebtoken');
const config = require('../utils/config');

function authenticate(req, res, next) {
  const token = req.cookies && req.cookies.shop_auth;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.clearCookie('shop_auth', { httpOnly: true, sameSite: 'lax', secure: config.cookieSecure });
    res.status(401).json({ error: 'Session is invalid or expired' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Administrator access required' });
  next();
}

module.exports = { authenticate, requireAdmin };
