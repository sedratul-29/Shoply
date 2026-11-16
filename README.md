# Shoply: Full-Stack E-Commerce App

Next.js 14 (App Router) + Tailwind CSS frontend, Express.js API, MongoDB database (Mongoose).

```
shop/
├── server/   Express API (port 5000)
└── client/   Next.js app (port 3000)
```

## Features

**Customers**
- Browse, search, filter by category, sort and paginate products
- Product detail page, cart (saved in the browser), checkout (cash on delivery)
- Register / log in / log out, order history, cancel a pending order

**Admin panel** (`/admin`, admins only)
- Dashboard: revenue, order counts, 7-day revenue chart, orders by status, low-stock list
- Products: create, edit, delete, hide, feature
- Orders: view details, change status (cancelling restocks items)
- Users: promote / demote admin, disable / enable accounts

## Setup

You need Node.js 18+ and a MongoDB database (local, or a free MongoDB Atlas cluster).

### 1. API

```bash
cd server
npm install
cp .env.example .env       # then edit .env (see below)
npm run seed               # creates the admin user + 12 sample products
npm run dev                # http://localhost:5000
```

In `server/.env` you must set:
- `MONGO_URI`: your MongoDB connection string
- `JWT_SECRET`: a random string of 32+ characters. Generate one with
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`: the first admin account created by `npm run seed`

The server refuses to start if `JWT_SECRET` is missing or too short.

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env.local
npm run dev                # http://localhost:3000
```

Open http://localhost:3000, log in with your admin email and password, and click **Admin** in the navbar.
**Change the seeded admin password after the first login.**

## How authentication and authorization work

- Passwords are hashed with bcrypt (cost 12). They are never returned by the API.
- Login issues a JWT stored in an **httpOnly, SameSite=Lax cookie** (`Secure` in production), so
  JavaScript on the page cannot read it.
- The browser only talks to Next.js. `next.config.js` proxies `/api/*` to Express, so the cookie is same-origin.
- Roles are `user` and `admin`. The `restrictTo('admin')` middleware protects **every** `/api/admin/*` route
  on the server. The Next.js middleware and admin layout redirects are only a convenience; they are not the security boundary.
- Registration never accepts a `role` field, so nobody can sign up as admin. Only an existing admin can promote users.
- Changing a password or disabling a user bumps `tokenVersion`, which immediately invalidates their existing tokens.
- Users can only read their own orders. Other people's order ids return 404.

## Security measures

| Threat | Protection |
|---|---|
| Brute-force login | Rate limit on login/register (30 per 15 min per IP) + account lock for 15 min after 5 failed attempts |
| User enumeration | Same error message for wrong email or wrong password, with equal response time |
| XSS token theft | httpOnly cookie; React escapes output; image URLs must be http(s) |
| CSRF | SameSite=Lax cookie + strict CORS + required `X-Requested-With` header on every write |
| NoSQL injection | `express-mongo-sanitize` + zod validation on all input |
| Mass assignment | zod schemas strip unknown fields |
| Parameter pollution | `hpp` |
| ReDoS / regex injection | User search text is escaped before use in `$regex` |
| Price tampering | Client sends only product ids and quantities; the server reads prices and computes totals |
| Overselling | Stock is decremented atomically (`stock >= qty`) and restored on failure or cancel |
| Oversized payloads | JSON body limited to 10 KB |
| Header attacks | `helmet` on the API, extra security headers in Next.js |
| Info leaks | Stack traces are logged on the server only; clients get generic 500 messages |
| Open redirect | The `?next=` login redirect only allows same-site relative paths |

## API overview

| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | public |
| GET/PUT | `/api/auth/me`, PUT `/api/auth/password` | logged in |
| GET | `/api/products`, `/api/products/:id`, `/api/products/categories` | public |
| POST | `/api/orders` | logged in |
| GET | `/api/orders/mine`, `/api/orders/:id` | owner or admin |
| PUT | `/api/orders/:id/cancel` | owner, pending orders only |
| GET | `/api/admin/stats` | admin |
| CRUD | `/api/admin/products` | admin |
| GET/PUT | `/api/admin/orders`, `/api/admin/orders/:id/status` | admin |
| GET/PUT | `/api/admin/users`, `/api/admin/users/:id` | admin |

## Before going to production

- Serve everything over HTTPS (the auth cookie is `Secure` only when `NODE_ENV=production`).
- Set `NODE_ENV=production`, `CLIENT_ORIGIN` to your real site URL, and `API_URL` (client) to your API URL.
- Use a strong, unique `JWT_SECRET` and keep `.env` files out of git.
- Restrict your MongoDB user and network access (Atlas IP allowlist).
- Payments are cash-on-delivery only. To take cards, add a provider such as Stripe and confirm payment on the server with webhooks.
- Add automated tests, backups, and monitoring.
