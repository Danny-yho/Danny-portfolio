const crypto = require('crypto');
const db = require('../db');
const config = require('../utils/config');
const { sendOrderConfirmation } = require('../utils/email');

function settingAmount(key, fallback) {
  const value = Number(db.prepare('SELECT value FROM settings WHERE key=?').get(key)?.value);
  return Number.isSafeInteger(value) && value >= 0 ? value : fallback;
}

const createOrder = db.transaction((input) => {
  const productLookup = db.prepare('SELECT id, name, price, stock, sizes, colors FROM products WHERE id=? AND active=1');
  const insertOrder = db.prepare(`INSERT INTO orders
    (tracking_code, customer_name, email, phone, address, total, currency)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const insertItem = db.prepare(`INSERT INTO order_items
    (order_id, product_id, product_name, unit_price, quantity, line_total, selected_size, selected_color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const updateStock = db.prepare('UPDATE products SET stock=stock-?, updated_at=datetime(\'now\') WHERE id=?');
  const lines = input.items.map((item) => {
    const product = productLookup.get(item.productId);
    if (!product) throw Object.assign(new Error(`Product ${item.productId} is unavailable`), { status: 400 });
    const sizes = JSON.parse(product.sizes || '[]');
    const colors = JSON.parse(product.colors || '[]');
    if ((sizes.length && !sizes.includes(item.size)) || (colors.length && !colors.includes(item.color))) {
      throw Object.assign(new Error(`Choose an available size and color for ${product.name}`), { status: 400 });
    }
    return { ...product, quantity: item.quantity, size: item.size || '', color: item.color || '', lineTotal: product.price * item.quantity };
  });
  const requestedByProduct = new Map();
  lines.forEach((item) => requestedByProduct.set(item.id, (requestedByProduct.get(item.id) || 0) + item.quantity));
  requestedByProduct.forEach((quantity, productId) => {
    const product = productLookup.get(productId);
    if (product.stock < quantity) throw Object.assign(new Error(`${product.name} does not have enough stock`), { status: 409 });
  });
  const subtotal = lines.reduce((sum, item) => sum + item.lineTotal, 0);
  const threshold = settingAmount('free_delivery_threshold', 50000);
  const stateKey = `delivery_fee_${String(input.state || '').toLowerCase().replace(/[^a-z]/g, '')}`;
  const shipping = subtotal >= threshold ? 0 : settingAmount(stateKey,
    settingAmount('delivery_fee_default', settingAmount('shipping_fee', 5500)));
  const total = subtotal + shipping;
  if (!Number.isSafeInteger(total)) throw Object.assign(new Error('Order total is invalid'), { status: 400 });
  const trackingCode = crypto.randomBytes(9).toString('hex').toUpperCase();
  const orderId = insertOrder.run(trackingCode, input.name, input.email, input.phone, input.address,
    total, config.paystackCurrency).lastInsertRowid;
  lines.forEach((item) => {
    insertItem.run(orderId, item.id, item.name, item.price, item.quantity, item.lineTotal, item.size, item.color);
    updateStock.run(item.quantity, item.id);
  });
  return { orderId, trackingCode, subtotal, deliveryFee: shipping, total, currency: config.paystackCurrency, items: lines.map((item) => ({
    productId: item.id, name: item.name, unitPrice: item.price, quantity: item.quantity,
    size: item.size, color: item.color, lineTotal: item.lineTotal
  })) };
});

function submitOrder(req, res) {
  const input = {
    name: req.body.customer.fullName,
    email: req.body.customer.email,
    phone: req.body.customer.phone,
    address: `${req.body.customer.address}${req.body.customer.state ? `, ${req.body.customer.state}` : ''}${req.body.customer.notes ? ` | Note: ${req.body.customer.notes}` : ''}`,
    state: req.body.customer.state,
    items: req.body.items
  };
  const order = createOrder(input);
  sendOrderConfirmation(order, input.email).catch(() => {});
  res.status(201).json({
    order: {
      orderNumber: order.trackingCode, subtotal: order.subtotal, deliveryFee: order.deliveryFee,
      total: order.total, currency: order.currency, items: order.items
    },
    paystackPublicKey: config.paystackPublicKey
  });
}

function trackOrder(req, res) {
  const order = db.prepare(`SELECT tracking_code AS trackingCode, status, payment_status AS paymentStatus,
    total, currency, created_at AS createdAt FROM orders WHERE tracking_code=?`).get(req.params.trackingCode);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const items = db.prepare(`SELECT product_name AS name, unit_price AS unitPrice, quantity, line_total AS lineTotal,
      selected_size AS size, selected_color AS color
    FROM order_items WHERE order_id=(SELECT id FROM orders WHERE tracking_code=?)`).all(req.params.trackingCode);
  res.json({ order: { ...order, items } });
}

function updatePayment(orderId, reference, status) {
  db.prepare(`UPDATE orders SET payment_status=?, payment_reference=COALESCE(payment_reference, ?),
    updated_at=datetime('now') WHERE id=?`).run(status, reference, orderId);
}

async function verifyPaystack(req, res) {
  if (!config.paystackSecretKey) return res.status(503).json({ error: 'Payments are not configured' });
  const order = db.prepare('SELECT id, total, currency, payment_status FROM orders WHERE tracking_code=?')
    .get(req.body.trackingCode);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (req.body.reference !== req.body.trackingCode) {
    return res.status(400).json({ verified: false, error: 'Payment reference does not match this order' });
  }
  if (order.payment_status === 'paid') return res.json({ verified: true, message: 'Payment already verified' });
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(req.body.reference)}`, {
    headers: { Authorization: `Bearer ${config.paystackSecretKey}` }
  });
  if (!response.ok) return res.status(502).json({ error: 'Unable to verify payment with provider' });
  const result = await response.json();
  const payment = result.data;
  const valid = result.status && payment && payment.status === 'success' &&
    payment.reference === req.body.reference && payment.amount === order.total * 100 && payment.currency === order.currency;
  if (!valid) return res.status(400).json({ verified: false, error: 'Payment details do not match this order' });
  updatePayment(order.id, req.body.reference, 'paid');
  res.json({ verified: true });
}

function paystackWebhook(req, res) {
  if (!config.paystackSecretKey) return res.status(503).json({ error: 'Payments are not configured' });
  const signature = req.get('x-paystack-signature') || '';
  const expected = crypto.createHmac('sha512', config.paystackSecretKey).update(req.rawBody || Buffer.alloc(0)).digest('hex');
  if (signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  const event = req.body;
  if (event.event === 'charge.success' && event.data && event.data.reference) {
    const order = db.prepare('SELECT id, total, currency FROM orders WHERE payment_reference=?')
      .get(event.data.reference) || db.prepare('SELECT id, total, currency FROM orders WHERE tracking_code=?')
        .get(event.data.metadata && event.data.metadata.trackingCode);
    if (order && event.data.amount === order.total * 100 && event.data.currency === order.currency) {
      updatePayment(order.id, event.data.reference, 'paid');
    }
  }
  res.json({ received: true });
}

module.exports = { submitOrder, trackOrder, verifyPaystack, paystackWebhook };
