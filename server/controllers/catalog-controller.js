const db = require('../db');
const config = require('../utils/config');

function parseList(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function publicProduct(product) {
  return {
    ...product,
    images: product.imageUrl ? [product.imageUrl] : [],
    sizes: parseList(product.sizes),
    colors: parseList(product.colors),
    featured: Boolean(product.featured),
    newArrival: Boolean(product.newArrival),
    bestSeller: Boolean(product.bestSeller)
  };
}

function listProducts(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 24));
  const conditions = ['p.active = 1'];
  const params = [];
  if (req.query.category) {
    conditions.push('(c.slug = ? OR c.name = ? COLLATE NOCASE)');
    params.push(req.query.category, req.query.category);
  }
  if (req.query.search) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
    params.push(`%${req.query.search}%`, `%${req.query.search}%`);
  }
  const minPrice = Number(req.query.minPrice);
  if (req.query.minPrice !== undefined && Number.isFinite(minPrice) && minPrice >= 0) {
    conditions.push('p.price >= ?');
    params.push(minPrice);
  }
  const maxPrice = Number(req.query.maxPrice);
  if (req.query.maxPrice !== undefined && Number.isFinite(maxPrice) && maxPrice >= 0) {
    conditions.push('p.price <= ?');
    params.push(maxPrice);
  }
  if (req.query.size) {
    conditions.push("EXISTS (SELECT 1 FROM json_each(p.sizes) WHERE value = ?)");
    params.push(String(req.query.size).slice(0, 20));
  }
  const where = conditions.join(' AND ');
  const sortBy = {
    newest: 'p.created_at DESC',
    'price-asc': 'p.price ASC',
    'price-desc': 'p.price DESC'
  }[req.query.sort] || 'p.featured DESC, p.created_at DESC';
  const total = db.prepare(`SELECT COUNT(*) AS count FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE ${where}`)
    .get(...params).count;
  const products = db.prepare(`SELECT p.id, p.name, p.slug, p.description, p.price, p.compare_at_price AS compareAtPrice,
    p.image_url AS imageUrl, p.sizes, p.colors, p.stock, p.featured, p.new_arrival AS newArrival,
    p.best_seller AS bestSeller, c.name AS category, c.slug AS categorySlug
    FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE ${where}
    ORDER BY ${sortBy} LIMIT ? OFFSET ?`)
    .all(...params, limit, (page - 1) * limit);
  res.json({ products: products.map(publicProduct), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

function getProduct(req, res) {
  const product = db.prepare(`SELECT p.id, p.name, p.slug, p.description, p.price,
    p.compare_at_price AS compareAtPrice, p.image_url AS imageUrl, p.sizes, p.colors,
    p.stock, p.featured, p.new_arrival AS newArrival, p.best_seller AS bestSeller,
    c.name AS category, c.slug AS categorySlug FROM products p LEFT JOIN categories c ON c.id=p.category_id
    WHERE p.active=1 AND (p.slug=? OR CAST(p.id AS TEXT)=?)`).get(req.params.slug, req.params.slug);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ product: publicProduct(product) });
}

function listCategories(req, res) {
  const categories = db.prepare(`SELECT c.id, c.name, c.slug, c.description, COUNT(p.id) AS productCount
    FROM categories c LEFT JOIN products p ON p.category_id=c.id AND p.active=1
    GROUP BY c.id ORDER BY c.name`).all();
  res.json({ categories });
}

function publicSettings(req, res) {
  const allowed = [
    'store_name', 'currency', 'contact_email', 'shipping_fee', 'delivery_fee_default',
    'delivery_fee_lagos', 'free_delivery_threshold', 'announcement'
  ];
  const settings = db.prepare(`SELECT key, value FROM settings WHERE key IN (${allowed.map(() => '?').join(',')})`)
    .all(...allowed);
  res.json({
    settings: {
      ...Object.fromEntries(settings.map(({ key, value }) => [key, value])),
      paystackPublicKey: config.paystackPublicKey
    }
  });
}

module.exports = { listProducts, getProduct, listCategories, publicSettings };
