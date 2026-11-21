const crypto = require('crypto');
const config = require('../utils/config');

const cookieOptions = {
  httpOnly: false,
  secure: config.cookieSecure,
  sameSite: 'lax',
  path: '/'
};

function issueToken(req, res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('shop_csrf', token, cookieOptions);
  res.json({ csrfToken: token });
}

function protect(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' ||
      (!req.path.startsWith('/api/admin') && req.path !== '/api/auth/logout')) return next();
  const cookie = req.cookies && req.cookies.shop_csrf;
  const header = req.get('x-csrf-token');
  if (!cookie || !header || cookie.length !== header.length ||
      !crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(header))) {
    return res.status(403).json({ error: 'CSRF token missing or invalid' });
  }
  next();
}

module.exports = { issueToken, protect };
