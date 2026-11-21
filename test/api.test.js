process.env.DATABASE_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret-with-more-than-thirty-two-characters';

const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const app = require('../server/app');
const db = require('../server/db');

const categoryId = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run('Test', 'test').lastInsertRowid;
db.prepare(`INSERT INTO products
  (category_id, name, slug, description, price, stock, active, featured, sizes, colors)
  VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`).run(categoryId, 'Test bag', 'test-bag', '', 15000, 5, '["M","L"]', '["Purple"]');
db.prepare("INSERT INTO settings (key, value) VALUES ('shipping_fee', '500')").run();
db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
  .run('Admin', 'admin@test.local', bcrypt.hashSync('SufficientTestPass!1', 4));

test('public catalog, order pricing, CSRF, and admin authentication', async () => {
  const health = await request(app).get('/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.status, 'ok');

  const catalog = await request(app).get('/api/products');
  assert.equal(catalog.status, 200);
  assert.equal(catalog.body.products[0].price, 15000);
  assert.deepEqual(catalog.body.products[0].sizes, ['M', 'L']);
  const filtered = await request(app).get('/api/products?category=Test&size=M&minPrice=10000&maxPrice=20000&sort=price-asc');
  assert.equal(filtered.body.pagination.total, 1);

  const newsletter = await request(app).post('/api/newsletter').send({ email: 'shopper@example.com' });
  assert.equal(newsletter.status, 201);

  const agent = request.agent(app);
  const csrf = await agent.get('/api/auth/csrf');
  assert.equal(csrf.status, 200);
  const token = csrf.body.csrfToken;
  const login = await agent.post('/api/auth/login')
    .send({ email: 'admin@test.local', password: 'SufficientTestPass!1' });
  assert.equal(login.status, 200);
  assert.match(login.headers['set-cookie'].join(';'), /shop_auth=.*HttpOnly/);

  const order = await agent.post('/api/orders')
    .set('X-CSRF-Token', token)
    .send({
      customer: {
        fullName: 'Test Shopper',
        email: 'shopper@example.com',
        phone: '+2348012345678',
        address: '12 Test Street, Lagos',
        state: 'Lagos'
      },
      paymentMethod: 'bank',
      items: [{ productId: 1, quantity: 2, size: 'M', color: 'Purple' }],
      total: 1,
      price: 1
    });
  assert.equal(order.status, 201);
  assert.equal(order.body.order.total, 30500);
  assert.equal(order.body.order.items[0].unitPrice, 15000);
  assert.equal(order.body.order.items[0].size, 'M');

  const invalidVariant = await agent.post('/api/orders')
    .set('X-CSRF-Token', token)
    .send({
      customer: { fullName: 'Test Shopper', email: 'shopper@example.com', phone: '+2348012345678', address: '12 Test Street' },
      items: [{ productId: 1, quantity: 1, size: 'XS', color: 'Purple' }]
    });
  assert.equal(invalidVariant.status, 400);

  const tracking = await request(app).get(`/api/orders/track/${order.body.order.orderNumber}`);
  assert.equal(tracking.status, 200);
  assert.equal(tracking.body.order.total, 30500);

  const adminProducts = await agent.get('/api/admin/products');
  assert.equal(adminProducts.status, 200);
});
