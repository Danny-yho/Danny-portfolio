const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../utils/config');

const cookieOptions = {
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: 'lax',
  path: '/',
  maxAge: 8 * 60 * 60 * 1000
};

function login(req, res) {
  const user = db.prepare('SELECT id, name, email, password_hash, role FROM users WHERE email = ? COLLATE NOCASE')
    .get(req.body.email);
  if (!user || !bcrypt.compareSync(req.body.password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
  res.cookie('shop_auth', token, cookieOptions);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

function logout(req, res) {
  res.clearCookie('shop_auth', { httpOnly: true, secure: config.cookieSecure, sameSite: 'lax', path: '/' });
  res.json({ message: 'Signed out' });
}

function me(req, res) {
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(401).json({ error: 'Account no longer exists' });
  res.json({ user });
}

module.exports = { login, logout, me };
