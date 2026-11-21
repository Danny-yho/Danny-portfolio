const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/order-controller');
const validate = require('../middleware/validate');
const schemas = require('../utils/schemas');

const router = express.Router();
const orderLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false });
router.post('/', orderLimiter, validate(schemas.order), controller.submitOrder);
router.get('/track', (req, res, next) => {
  req.params.trackingCode = String(req.query.orderNumber || '').trim().toUpperCase();
  const parsed = schemas.trackingCode.safeParse({ trackingCode: req.params.trackingCode });
  if (!parsed.success) return res.status(400).json({ error: 'Invalid tracking code' });
  req.trackPhone = String(req.query.phone || '').trim();
  next();
}, (req, res) => {
  const db = require('../db');
  const order = db.prepare(`SELECT tracking_code AS trackingCode, status, payment_status AS paymentStatus,
    total, currency, created_at AS createdAt FROM orders WHERE tracking_code=? AND phone=?`)
    .get(req.params.trackingCode, req.trackPhone);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});
router.get('/track/:trackingCode', (req, res, next) => {
  const parsed = schemas.trackingCode.safeParse({ trackingCode: req.params.trackingCode });
  if (!parsed.success) return res.status(400).json({ error: 'Invalid tracking code' });
  next();
}, controller.trackOrder);

module.exports = router;
