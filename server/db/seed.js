const bcrypt = require('bcryptjs');
const db = require('./index');

const categories = [
  ['Dresses', 'dresses', 'Easy-to-wear dresses for everyday plans and special moments.'],
  ['Tops', 'tops', 'Polished tops to style your way.'],
  ['Skirts', 'skirts', 'Feminine skirts made for day-to-night dressing.'],
  ['Two-Piece Sets', 'two-piece-sets', 'Coordinated sets that make getting dressed easy.'],
  ['Jumpsuits', 'jumpsuits', 'One-piece statements with a confident fit.'],
  ['Bags & Accessories', 'bags-accessories', 'Finishing touches for a complete look.'],
  ['Ankara/Native Wear', 'ankara-native-wear', 'Contemporary Nigerian-inspired styles.'],
  ['Footwear', 'footwear', 'Statement shoes for every occasion.']
];
const legacySlugs = [
  'amara-structured-tote', 'luxe-mini-crossbody', 'nia-evening-clutch', 'sculpted-hoop-earrings',
  'pearl-drop-earrings', 'celeste-layered-necklace', 'ari-signet-ring', 'zara-satin-midi-dress',
  'mira-tailored-blazer', 'lola-knit-coord-set', 'dara-pleated-skirt', 'classic-silk-scarf',
  'everyday-leather-belt', 'oversized-luxe-sunglasses', 'vikky-signature-watch', 'velvet-matte-lip-kit',
  'glow-ritual-gift-set', 'soft-touch-makeup-pouch'
];
const bestSellerSlugs = ['nia-occasion-maxi','zara-everyday-shirt-dress','amara-mini-shoulder-bag','pearl-evening-clutch'];
const products = [
  ['Amara Wrap Midi Dress', 'amara-wrap-midi-dress', 'Dresses', 'A flattering wrap-front midi with a softly defined waist.', 38500, 12, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80', ['XS','S','M','L','XL'], ['Violet','Black'], 1, 1, 0],
  ['Lagos Day-to-Night Dress', 'lagos-day-to-night-dress', 'Dresses', 'A versatile dress that feels as good at brunch as it does at dinner.', 42000, 8, 'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?auto=format&fit=crop&w=900&q=80', ['XS','S','M','L','XL'], ['Wine','Black'], 1, 1, 0],
  ['Nia Occasion Maxi', 'nia-occasion-maxi', 'Dresses', 'A graceful full-length silhouette for celebrations and evenings.', 56500, 7, 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80', ['XS','S','M','L','XL'], ['Purple','Emerald'], 1, 0, 1],
  ['Zara Everyday Shirt Dress', 'zara-everyday-shirt-dress', 'Dresses', 'A relaxed shirt dress with an easy, polished fit.', 34500, 10, 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=900&q=80', ['XS','S','M','L','XL','XXL'], ['Cream','Blue'], 0, 0, 0],
  ['Velvet Evening Top', 'velvet-evening-top', 'Tops', 'A rich statement top that pairs beautifully with tailored bottoms.', 18500, 20, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80', ['XS','S','M','L','XL'], ['Black','Purple'], 1, 1, 0],
  ['Sade Soft Blouse', 'sade-soft-blouse', 'Tops', 'A soft, feminine blouse designed for effortless styling.', 22000, 13, 'https://images.unsplash.com/photo-1564257577-6a4c6f7a7a5f?auto=format&fit=crop&w=900&q=80', ['XS','S','M','L','XL'], ['Ivory','Lavender'], 0, 0, 0],
  ['Vikky Statement Shirt', 'vikky-statement-shirt', 'Tops', 'A relaxed statement shirt with a flattering drape.', 24500, 9, 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=900&q=80', ['XS','S','M','L','XL'], ['White','Lilac'], 0, 0, 0],
  ['Ayo Pleated Midi Skirt', 'ayo-pleated-midi-skirt', 'Skirts', 'A fluid pleated skirt that moves beautifully from desk to dinner.', 28500, 9, 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=900&q=80', ['XS','S','M','L','XL'], ['Lavender','Black'], 1, 1, 0],
  ['Dara Classic Pencil Skirt', 'dara-classic-pencil-skirt', 'Skirts', 'A clean, comfortable pencil skirt with a refined silhouette.', 24500, 12, '/images/tiktok-yellow-look.avif', ['XS','S','M','L','XL'], ['Black','Wine'], 0, 0, 0],
  ['Lola Knit Two-Piece', 'lola-knit-two-piece', 'Two-Piece Sets', 'A coordinating knit set for an instantly put-together look.', 48500, 10, '/images/vikky-knit-set.jpg', ['XS','S','M','L','XL'], ['Cream','Purple'], 1, 1, 0],
  ['Weekend Co-ord Set', 'weekend-coord-set', 'Two-Piece Sets', 'An easy matching set for relaxed weekends and travel days.', 42500, 11, 'https://images.unsplash.com/photo-1566206091558-7f218b696731?auto=format&fit=crop&w=900&q=80', ['XS','S','M','L','XL','XXL'], ['Rose','Olive'], 0, 0, 0],
  ['Zuri Satin Jumpsuit', 'zuri-satin-jumpsuit', 'Jumpsuits', 'A sleek one-piece with a flattering waist and elegant finish.', 46500, 6, 'https://images.unsplash.com/photo-1568251188392-ae32fbee7c6d?auto=format&fit=crop&w=900&q=80', ['XS','S','M','L','XL'], ['Wine','Black'], 1, 1, 0],
  ['Chioma Tailored Jumpsuit', 'chioma-tailored-jumpsuit', 'Jumpsuits', 'A tailored jumpsuit made for confident, effortless dressing.', 52000, 5, '/images/tiktok-dress.avif', ['XS','S','M','L','XL'], ['Purple','Navy'], 0, 0, 0],
  ['Nneka Ankara Midi', 'nneka-ankara-midi', 'Ankara/Native Wear', 'A modern Ankara-inspired midi celebrating expressive prints.', 39500, 14, 'https://images.unsplash.com/photo-1589156288859-f0cb0d82b065?auto=format&fit=crop&w=900&q=80', ['XS','S','M','L','XL','XXL'], ['Mixed print'], 1, 1, 0],
  ['Adire Everyday Set', 'adire-everyday-set', 'Ankara/Native Wear', 'A relaxed native-inspired set with contemporary proportions.', 44000, 8, '/images/tiktok-two-piece.avif', ['XS','S','M','L','XL'], ['Indigo'], 0, 0, 0],
  ['Amara Mini Shoulder Bag', 'amara-mini-shoulder-bag', 'Bags & Accessories', 'A compact shoulder bag to finish your everyday look.', 28500, 15, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80', ['One Size'], ['Purple','Black'], 0, 0, 1],
  ['Vikky Satin Head Scarf', 'vikky-satin-head-scarf', 'Bags & Accessories', 'A soft satin scarf that adds a polished finishing touch.', 12500, 22, 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=900&q=80', ['One Size'], ['Lavender','Rose'], 0, 0, 0],
  ['Pearl Evening Clutch', 'pearl-evening-clutch', 'Bags & Accessories', 'A refined clutch for celebrations and special evenings.', 32000, 7, 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=900&q=80', ['One Size'], ['Pearl','Black'], 0, 0, 1],
  ['Red Vikky Sneaker', 'red-vikky-sneaker', 'Footwear', 'A vivid red everyday sneaker for standout casual styling.', 15000, 15, '/images/vikky-red-shoe.jpg', ['36','37','38','39','40','41','42'], ['Red'], 1, 1, 0],
  ['Floral Platform Heel', 'floral-platform-heel', 'Footwear', 'A colourful floral platform heel with a confident silhouette.', 11000, 10, '/images/vikky-platform-shoe.jpg', ['36','37','38','39','40','41'], ['Blue','Floral'], 1, 1, 0],
  ['Vikky Red Shoulder Bag', 'vikky-red-shoulder-bag', 'Bags & Accessories', 'A polished red shoulder bag that completes a statement look.', 16500, 12, '/images/vikky-red-bag.jpg', ['One Size'], ['Red'], 1, 1, 0],
  ['Classic Heeled Mule', 'classic-heeled-mule', 'Footwear', 'An elegant heeled mule for dressing up simple outfits.', 26500, 8, '/images/vikky-blue-heel.jpg', ['36','37','38','39','40','41'], ['Blue','Red'], 0, 0, 0],
  ['Vikky African Skin Top', 'vikky-african-skin-top', 'Tops', 'A relaxed statement top styled for warm, confident everyday looks.', 10500, 20, '/images/vikky-native-set.jpg', ['XS','S','M','L','XL','XXL'], ['White','Black'], 1, 1, 0]
];

const seed = db.transaction(() => {
  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, slug, description) VALUES (?, ?, ?)');
  categories.forEach((row) => insertCategory.run(...row));
  const getCategory = db.prepare('SELECT id FROM categories WHERE name = ?');
  const migrationKey = 'fashion_catalog_v1';
  const migrated = db.prepare('SELECT value FROM settings WHERE key=?').get(migrationKey);
  const updateProduct = db.prepare(`UPDATE products SET category_id=?, name=?, slug=?, description=?, price=?,
    stock=?, image_url=?, sizes=?, colors=?, featured=?, new_arrival=?, best_seller=?, updated_at=datetime('now')
    WHERE id=?`);
  const legacyProduct = db.prepare('SELECT id FROM products WHERE slug=?');
  const insertProduct = db.prepare(`INSERT OR IGNORE INTO products
    (category_id, name, slug, description, price, stock, image_url, sizes, colors, featured, new_arrival, best_seller)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  if (!migrated) {
    products.forEach((product, index) => {
      const [name, slug, category, description, price, stock, imageUrl, sizes, colors, featured, newArrival, bestSeller] = product;
      const existing = legacyProduct.get(legacySlugs[index]);
      if (existing) {
        updateProduct.run(getCategory.get(category).id, name, slug, description, price, stock, imageUrl,
          JSON.stringify(sizes), JSON.stringify(colors), featured, newArrival, bestSeller, existing.id);
      } else {
        insertProduct.run(getCategory.get(category).id, name, slug, description, price, stock, imageUrl,
          JSON.stringify(sizes), JSON.stringify(colors), featured, newArrival, bestSeller);
      }
    });
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(migrationKey, 'done');
    db.prepare(`DELETE FROM categories WHERE slug IN ('handbags','jewelry','womenswear','accessories','beauty')
      AND NOT EXISTS (SELECT 1 FROM products WHERE products.category_id=categories.id)`).run();
  } else {
    products.forEach(([name, slug, category, description, price, stock, imageUrl, sizes, colors, featured, newArrival, bestSeller]) => {
      insertProduct.run(getCategory.get(category).id, name, slug, description, price, stock, imageUrl,
        JSON.stringify(sizes), JSON.stringify(colors), featured, newArrival, bestSeller);
    });
  }
  const bestSellerMigration = 'fashion_catalog_v2';
  if (!db.prepare('SELECT value FROM settings WHERE key=?').get(bestSellerMigration)) {
    const seededSlugs = products.map((product) => product[1]);
    const placeholders = seededSlugs.map(() => '?').join(',');
    db.prepare(`UPDATE products SET best_seller=CASE WHEN slug IN (${bestSellerSlugs.map(() => '?').join(',')}) THEN 1 ELSE 0 END
      WHERE slug IN (${placeholders})`).run(...bestSellerSlugs, ...seededSlugs);
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(bestSellerMigration, 'done');
  }
  const flagMigration = 'fashion_catalog_v3';
  if (!db.prepare('SELECT value FROM settings WHERE key=?').get(flagMigration)) {
    const updateFlags = db.prepare('UPDATE products SET featured=?, new_arrival=?, best_seller=? WHERE slug=?');
    products.forEach((product) => updateFlags.run(product[9], product[10], product[11], product[1]));
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(flagMigration, 'done');
  }
  const variantMigration = 'fashion_catalog_v4';
  if (!db.prepare('SELECT value FROM settings WHERE key=?').get(variantMigration)) {
    const updateVariants = db.prepare('UPDATE products SET sizes=?, colors=? WHERE slug=?');
    products.forEach((product) => updateVariants.run(JSON.stringify(product[7]), JSON.stringify(product[8]), product[1]));
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(variantMigration, 'done');
  }

  const refreshCatalogImage = db.prepare('UPDATE products SET image_url=?, price=? WHERE slug=?');
  products.forEach(([name, slug, category, description, price, stock, imageUrl]) => {
    refreshCatalogImage.run(imageUrl, price, slug);
  });

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) before seeding');
  }
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!adminExists) {
    db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run(process.env.ADMIN_NAME || 'Shop Administrator', email, bcrypt.hashSync(password, 12));
  }
  const defaults = [
    ['store_name', 'Shop with Vikky'],
    ['currency', 'NGN'],
    ['contact_email', email],
    ['shipping_fee', '5500'],
    ['delivery_fee_default', '5500'],
    ['delivery_fee_lagos', '3500'],
    ['free_delivery_threshold', '50000'],
    ['announcement', '“Style you love, delivered quickly and reliably.”']
  ];
  const setting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  defaults.forEach((row) => setting.run(...row));
});

try {
  seed();
  console.log(`Seed complete: ${db.prepare('SELECT COUNT(*) AS count FROM products').get().count} products.`);
} finally {
  db.close();
}
