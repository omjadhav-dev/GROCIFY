# Grocify — B2B Grocery Platform (v2)

Modernized stack: **React (Vite) + Tailwind CSS + lucide-react** on the frontend,
**Express + Sequelize + MySQL** on the backend, real-time chat via **Socket.IO**.

Migrated from the original CRA + MongoDB/Mongoose MERN app. Business logic and
features are unchanged — only the stack and UI were rebuilt.

## Stack

| Layer | Before | Now |
|---|---|---|
| Frontend tooling | Create React App | Vite |
| Styling | Plain CSS | Tailwind CSS |
| Icons | Emoji | lucide-react |
| Database | MongoDB (Mongoose) | MySQL (Sequelize) |
| Validation | Manual checks | express-validator |

**Not included (by request):** Helmet and Autoprefixer were left out of this
build to keep the stack minimal. Tailwind still runs through PostCSS (that part
is required by Tailwind itself), just without the Autoprefixer plugin.

## Prerequisites

- Node.js 18+
- A running MySQL 8 server (local install, Docker, or a hosted instance)

## 1. Set up the database

```sql
CREATE DATABASE grocify;
```

No need to create tables manually — Sequelize creates them automatically on
first run (`sequelize.sync()` in `backend/src/server.js`). For a real
production deploy, swap that for proper Sequelize migrations instead.

## 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your MySQL credentials:

```
PORT=5000
CLIENT_URL=http://localhost:5173

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=grocify
DB_USER=root
DB_PASSWORD=your_mysql_password

JWT_SECRET=some_long_random_string
```

## 3. Install & run

From the project root:

```bash
npm run install:all   # installs both backend and frontend dependencies
npm run dev           # runs backend (port 5000) and frontend (port 5173) together
```

Or run them separately:

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Open **http://localhost:5173**.

## Project structure

```
grocify-mern-mysql/
├── backend/
│   └── src/
│       ├── config/db.js        # Sequelize connection
│       ├── models/             # User, Product, Order, OrderItem, Message
│       ├── routes/             # auth, products, orders, chat, profile
│       ├── middleware/         # auth, upload (multer), validate
│       └── server.js
└── frontend/
    └── src/
        ├── pages/               # Landing, Login, Register, Dashboard, Products, Orders, Chat, Profile
        ├── components/          # Sidebar, ProtectedRoute
        ├── context/AuthContext.jsx
        └── api.js
```

## Data model notes (MongoDB → MySQL)

- Mongo `_id` (ObjectId) → MySQL auto-increment integer `id`. The frontend was
  updated accordingly (`order.id`, `product.id`, etc. instead of `_id`).
- Mongo's embedded `order.items` array is now a normalized `order_items` table
  (`Order.hasMany(OrderItem)`), created inside a transaction when an order is
  placed — if anything fails partway through, all the writes roll back together.
- Mongoose `populate()` → Sequelize `include` (e.g. products include their wholesaler).
- Password hashing moved from a Mongoose pre-save hook to a Sequelize `beforeSave` hook — same bcrypt logic.

## What's new vs. the original

- **express-validator** on the register/login/add-product routes (clean 400s instead of ad hoc checks)
- **Vite** dev server proxies `/api` and `/uploads` to the Express backend — no CORS wrangling needed in dev
- **lucide-react** icons throughout instead of emoji
- Tailwind design system with a small custom `leaf` / `harvest` color palette (see `tailwind.config.js`)
