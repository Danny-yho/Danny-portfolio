const db = require('../db');

function productList(rows) {
  return rows.map((product) => ({
    ...product,
    sizes: JSON.parse(product.sizes || '[]'),
    colors: JSON.parse(product.colors || '[]'),
    active: Boolean(product.active),
    featured: Boolean(product.featured),
    newArrival: Boolean(product.new_arrival),
    bestSeller: Boolean(product.best_seller)
  }));
}

function listProducts(req, res) {
  res.json({ products: productList(db.prepare(`SELECT p.*, c.name AS category FROM products p
    LEFT JOIN categories c ON c.id=p.category_id ORDER BY p.created_at DESC`).all()) });
}

function createProduct(req, res) {
  const result = db.prepare(`INSERT INTO products
    (category_id, name, slug, description, price, compare_at_price, image_url, sizes, colors,
     stock, active, featured, new_arrival, best_seller)
    VALUES (@categoryId, @name, @slug, @description, @price, @compareAtPrice, @imageUrl, @sizes, @colors,
     @stock, @active, @featured, @newArrival, @bestSeller)`)
    .run({
      ...req.body,
      sizes: JSON.stringify(req.body.sizes),
      colors: JSON.stringify(req.body.colors)
    });
  res.status(201).json({ product: db.prepare('SELECT * FROM products WHERE id=?').get(result.lastInsertRowid) });
}

function updateProduct(req, res) {
  const existing = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  const fields = {
    ...req.body,
    categoryId: req.body.categoryId === undefined ? existing.category_id : req.body.categoryId,
    compareAtPrice: req.body.compareAtPrice === undefined ? existing.compare_at_price : req.body.compareAtPrice,
    imageUrl: req.body.imageUrl === undefined ? existing.image_url : req.body.imageUrl,
    sizes: JSON.stringify(req.body.sizes === undefined ? JSON.parse(existing.sizes || '[]') : req.body.sizes),
    colors: JSON.stringify(req.body.colors === undefined ? JSON.parse(existing.colors || '[]') : req.body.colors),
    active: req.body.active === undefined ? Boolean(existing.active) : req.body.active,
    featured: req.body.featured === undefined ? Boolean(existing.featured) : req.body.featured,
    newArrival: req.body.newArrival === undefined ? Boolean(existing.new_arrival) : req.body.newArrival,
    bestSeller: req.body.bestSeller === undefined ? Boolean(existing.best_seller) : req.body.bestSeller,
    id: existing.id
  };
  db.prepare(`UPDATE products SET category_id=@categoryId, name=@name, slug=@slug, description=@description,
    price=@price, compare_at_price=@compareAtPrice, image_url=@imageUrl, sizes=@sizes, colors=@colors,
    stock=@stock, active=@active, featured=@featured, new_arrival=@newArrival, best_seller=@bestSeller,
    updated_at=datetime('now') WHERE id=@id`).run(fields);
  res.json({ product: db.prepare('SELECT * FROM products WHERE id=?').get(existing.id) });
}

function deleteProduct(req, res) {
  const result = db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Product not found' });
  res.status(204).end();
}

function listCategories(req, res) {
  res.json({ categories: db.prepare('SELECT * FROM categories ORDER BY name').all() });
}

function createCategory(req, res) {
  const result = db.prepare('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)')
    .run(req.body.name, req.body.slug, req.body.description);
  res.status(201).json({ category: db.prepare('SELECT * FROM categories WHERE id=?').get(result.lastInsertRowid) });
}

function updateCategory(req, res) {
  const result = db.prepare('UPDATE categories SET name=?, slug=?, description=? WHERE id=?')
    .run(req.body.name, req.body.slug, req.body.description, req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Category not found' });
  res.json({ category: db.prepare('SELECT * FROM categories WHERE id=?').get(req.params.id) });
}

function deleteCategory(req, res) {
  const result = db.prepare('DELETE FROM categories WHERE id=?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Category not found' });
  res.status(204).end();
}

function listOrders(req, res) {
  const orders = db.prepare('SELECT id, tracking_code AS trackingCode, customer_name AS customerName, email, phone, address, status, payment_status AS paymentStatus, payment_reference AS paymentReference, total, currency, created_at AS createdAt FROM orders ORDER BY created_at DESC LIMIT 200').all();
  res.json({ orders });
}

function updateOrder(req, res) {
  const order = db.prepare('SELECT id, status, inventory_restored FROM orders WHERE id=?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'cancelled' && req.body.status !== 'cancelled') {
    return res.status(409).json({ error: 'Cancelled orders cannot be reopened' });
  }
  const update = db.transaction(() => {
    if (req.body.status === 'cancelled' && !order.inventory_restored) {
      db.prepare('UPDATE products SET stock=stock+oi.quantity, updated_at=datetime(\'now\') FROM order_items oi WHERE products.id=oi.product_id AND oi.order_id=?')
        .run(order.id);
      db.prepare('UPDATE orders SET inventory_restored=1 WHERE id=?').run(order.id);
    }
    db.prepare("UPDATE orders SET status=?, updated_at=datetime('now') WHERE id=?").run(req.body.status, order.id);
  });
  update();
  res.json({ order: db.prepare('SELECT id, tracking_code AS trackingCode, status, payment_status AS paymentStatus FROM orders WHERE id=?').get(order.id) });
}

function listSettings(req, res) {
  res.json({ settings: db.prepare('SELECT key, value FROM settings ORDER BY key').all() });
}

function updateSettings(req, res) {
  const write = db.prepare("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')");
  const transaction = db.transaction((settings) => {
    for (const [key, value] of Object.entries(settings)) write.run(key, String(value));
  });
  transaction(req.body);
  res.json({ settings: db.prepare('SELECT key, value FROM settings ORDER BY key').all() });
}

function uploadImage(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Image file is required' });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
}

function listMessages(req, res) {
  res.json({
    contacts: db.prepare('SELECT id, name, email, subject, message, created_at AS createdAt FROM contacts ORDER BY created_at DESC').all(),
    subscribers: db.prepare('SELECT id, email, created_at AS createdAt FROM newsletter_subscribers ORDER BY created_at DESC').all()
  });
}

module.exports = {
  listProducts, createProduct, updateProduct, deleteProduct, listCategories, createCategory,
  updateCategory, deleteCategory, listOrders, updateOrder, listSettings, updateSettings, uploadImage, listMessages
};
