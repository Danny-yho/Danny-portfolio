const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('../utils/config');

fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });
const db = new Database(config.databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
db.prepare('UPDATE settings SET value = ? WHERE key = ? AND value = ?')
  .run('“Style you love, delivered quickly and reliably.”', 'announcement', 'Free delivery on orders above ₦50,000');

const productColumns = new Set(db.prepare('PRAGMA table_info(products)').all().map(({ name }) => name));
const productMigrations = {
  sizes: "TEXT NOT NULL DEFAULT '[]'",
  colors: "TEXT NOT NULL DEFAULT '[]'",
  new_arrival: 'INTEGER NOT NULL DEFAULT 0 CHECK (new_arrival IN (0, 1))',
  best_seller: 'INTEGER NOT NULL DEFAULT 0 CHECK (best_seller IN (0, 1))'
};
for (const [column, definition] of Object.entries(productMigrations)) {
  if (!productColumns.has(column)) db.exec(`ALTER TABLE products ADD COLUMN ${column} ${definition}`);
}

const orderItemColumns = new Set(db.prepare('PRAGMA table_info(order_items)').all().map(({ name }) => name));
for (const [column, definition] of Object.entries({ selected_size: "TEXT NOT NULL DEFAULT ''", selected_color: "TEXT NOT NULL DEFAULT ''" })) {
  if (!orderItemColumns.has(column)) db.exec(`ALTER TABLE order_items ADD COLUMN ${column} ${definition}`);
}

module.exports = db;
