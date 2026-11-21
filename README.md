# Shop with Vikky backend

Modular Node.js/Express API using better-sqlite3. Requires Node.js 20+.

## Local setup

1. Copy `.env.example` to `.env` and set a unique `JWT_SECRET` (at least 32 characters) and strong admin credentials.
2. Run `npm install`, `npm run seed`, then `npm run dev`.
3. API is served at `http://localhost:3000`; `GET /health` checks service/database health.

Never commit `.env`, the SQLite database, or uploaded files. For production use HTTPS, set `COOKIE_SECURE=true`, configure `CLIENT_ORIGIN`, and provide Paystack credentials.

## API overview

- Public: `GET /api/products`, `/api/categories`, `/api/settings`, `POST /api/orders`, `GET /api/orders/track/:trackingCode`, `POST /api/contact`, `POST /api/newsletter`.
- Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/auth/csrf`.
- Admin (admin role required): `/api/admin/products`, `/api/admin/categories`, `/api/admin/orders`, `/api/admin/settings`, `POST /api/admin/uploads`.
- Payments: `POST /api/payments/paystack/verify` (authenticated order owner/admin); `POST /api/payments/paystack/webhook` (Paystack signature verified).

All mutation requests other than login and the signed Paystack webhook require the CSRF token returned by `/api/auth/csrf` in the `X-CSRF-Token` header. The API uses an httpOnly JWT cookie; browser clients should send credentials. Cart line prices and totals are always read from SQLite, never trusted from the client. Order creation accepts `items: [{ productId, quantity }]` and customer name/email/phone/address.

## Assets and uploads

The supplied logo is available as `public/images/logo-full.png`. `logo-transparent.png` currently matches the supplied image; no background extraction was performed. Create `public/images/logo-icon.png` only from an approved standalone icon asset. Uploaded images are served under `/uploads/` and are restricted to image formats.

## Operations

Run `npm start` for production. `npm run seed` creates the initial catalog and administrator from `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`; it is safe to rerun and does not replace existing products or reset an existing admin password. Back up `data/shop.sqlite` and uploaded files together.

## Storefront

- Customer pages are served from `public/`, including the home, shop, product, cart, checkout, success, tracking, about, contact, FAQ and 404 pages.
- The complete customer application is available at `http://localhost:3000`.
- The protected dashboard is available at `http://localhost:3000/admin/`.
- Set Paystack public and secret keys in `.env`. Never expose the secret key in browser code.
- Replace `public/images/logo-full.png` for the full logo, `public/images/logo-transparent.png` for transparent navigation artwork, and `public/images/logo-icon.svg` for the silhouette/favicon.
