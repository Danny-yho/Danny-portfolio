const db = require('../db');

function submitContact(req, res) {
  const result = db.prepare('INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)')
    .run(req.body.name, req.body.email, req.body.subject, req.body.message);
  res.status(201).json({ message: 'Your message has been received', id: result.lastInsertRowid });
}

function subscribe(req, res) {
  db.prepare('INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)').run(req.body.email);
  res.status(201).json({ message: 'Thanks for subscribing' });
}

module.exports = { submitContact, subscribe };
