# Grocify

A B2B grocery marketplace connecting **wholesalers** who supply groceries in
bulk with **shopkeepers** who need to stock their stores. Wholesalers list
what they have, shopkeepers order what they need, and both sides track the
order and chat through it in real time.

## Why a marketplace, not a typical online store

Most e-commerce projects are one seller selling to many buyers. Grocify is
two-sided: wholesalers *and* shopkeepers both have accounts, both have
dashboards, and an order isn't just "add to cart and pay" — it goes through
a proper approval flow (a wholesaler can accept or reject before it's ever
dispatched). That makes the data model and permissions meaningfully more
involved than a standard shop.

## Features

- **Role-based accounts** — Shopkeeper and Wholesaler portals with separate
  dashboards and permissions, JWT-authenticated
- **Product catalog** — wholesalers add, edit, and delete products (image
  upload, stock, pricing, category); shopkeepers search and browse
- **Order management** — place orders and track them through a real status
  flow: `Pending → Accepted / Rejected → Dispatched → Delivered`, with an
  itemized order-detail view
- **Real-time notifications** — the moment an order is placed or its status
  changes, the other party gets notified instantly (Socket.IO), with a
  notification center showing unread counts and history
- **Live stock tracking** — placing an order atomically reserves stock
  (row-locked, so two shopkeepers can't oversell the same units); a
  rejected order restores it. Every connected client sees stock levels
  update instantly, and wholesalers get an automatic alert when a product
  hits their configured low-stock threshold or runs out entirely
- **Wholesaler analytics** — revenue summary, average order value, order
  status breakdown, a 14-day revenue trend, and a top-selling-products
  breakdown, shown right on the dashboard
- **Real-time chat** — Socket.IO messaging between a shopkeeper and
  wholesaler, with a contacts list and unread badges
- **Profile management** — edit account details and change password

## Tech Stack

| Layer         | Technology                                                 |
|---------------|-------------------------------------------------------------|
| Frontend      | React 18 (Vite), React Router, Tailwind CSS, HTML5/CSS3, lucide-react icons |
| Backend       | Node.js, Express.js                                        |
| Database      | MySQL, via Sequelize ORM                                   |
| Real-time     | Socket.IO (chat + live notifications)                      |
| Auth          | JWT (jsonwebtoken) + bcryptjs                               |
| Validation    | express-validator                                           |
| File uploads  | Multer (local disk storage)                                 |

> **Note on image storage:** product images currently go through Multer to
> local disk (`backend/src/uploads`), served as static files. There's no
> Cloudinary (or other cloud storage) integration yet.

## Project Structure

```
grocify/
├── backend/
│   └── src/
│       ├── config/db.js          # Sequelize connection
│       ├── models/               # User, Product, Order, OrderItem, Message, Notification
│       ├── routes/               # auth, products, orders, chat, profile, notifications, analytics
│       ├── middleware/           # auth, upload (multer), validate
│       ├── utils/notify.js       # creates + pushes notifications over sockets
│       ├── socket.js             # Socket.IO connection + online-user tracking
│       ├── uploads/              # uploaded product images
│       └── server.js
└── frontend/
    └── src/
        ├── pages/                 # Landing, Login, Register, Dashboard,
        │                          # Products, Orders, Chat, Profile
        ├── components/            # Sidebar, NotificationBell, ProtectedRoute
        ├── context/AuthContext.jsx
        └── api.js
```

## Getting Started

### Prerequisites

- Node.js 18+
- A running MySQL 8 server

### 1. Create the database

```sql
CREATE DATABASE grocify;
```

Tables are created automatically on first run via `sequelize.sync()`. For
production, replace this with proper Sequelize migrations.

> **Note:** `sequelize.sync()` only creates tables that don't exist yet — it
> never alters an existing table to match model changes. If you're updating
> an existing database rather than starting fresh, run any new-column
> migrations by hand, e.g. for the low-stock-threshold field added to
> `Product`:
> ```sql
> ALTER TABLE products ADD COLUMN low_stock_threshold INT NOT NULL DEFAULT 5;
> ```
> (Column names are `snake_case` — the models use Sequelize's `underscored`
> option, so a model field like `lowStockThreshold` maps to
> `low_stock_threshold` in MySQL.)

### 2. Configure environment variables

Create `backend/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=grocify
DB_USER=root
DB_PASSWORD=your_mysql_password

JWT_SECRET=some_long_random_string
```

### 3. Install and run

From the project root:

```bash
npm run install:all   # installs backend + frontend dependencies
npm run dev            # runs backend (5000) and frontend (5173) together
```

Or run each side separately:

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Then open **http://localhost:5173**.

## API Reference

All routes are prefixed with `/api`. 🔒 = requires a JWT
(`Authorization: Bearer <token>`), 🏪 = wholesaler-only, 🧑‍🌾 = shopkeeper-only.

### Auth
| Method | Endpoint          | Description        |
|--------|--------------------|----------------------|
| POST   | `/auth/register`   | Create an account   |
| POST   | `/auth/login`      | Log in, returns JWT |

### Products
| Method | Endpoint            | Description                              |
|--------|-----------------------|--------------------------------------------|
| GET    | `/products` 🔒        | List all products                        |
| GET    | `/products/my` 🔒🏪    | List the logged-in wholesaler's products |
| POST   | `/products` 🔒🏪       | Add a product (multipart, image upload)  |
| PUT    | `/products/:id` 🔒🏪   | Update a product                         |
| DELETE | `/products/:id` 🔒🏪   | Delete a product                         |

### Orders
| Method | Endpoint                  | Description                                |
|--------|------------------------------|-----------------------------------------------|
| POST   | `/orders` 🔒🧑‍🌾            | Place an order (transaction; row-locks and decrements stock, broadcasts the new stock level, alerts the wholesaler if it's now low/out) |
| GET    | `/orders/my` 🔒              | List the logged-in user's orders             |
| GET    | `/orders/:id` 🔒             | Get order detail (items, addresses, etc.)    |
| PUT    | `/orders/:id/status` 🔒🏪    | Update order status — triggers a notification; a `Rejected` status restores the reserved stock |

### Notifications
| Method | Endpoint                      | Description                        |
|--------|----------------------------------|---------------------------------------|
| GET    | `/notifications` 🔒               | List the logged-in user's notifications |
| GET    | `/notifications/unread-count` 🔒  | Get just the unread count             |
| PUT    | `/notifications/:id/read` 🔒      | Mark one notification as read         |
| PUT    | `/notifications/read-all` 🔒      | Mark all as read                      |

### Analytics
| Method | Endpoint                  | Description                                              |
|--------|------------------------------|--------------------------------------------------------------|
| GET    | `/analytics/wholesaler` 🔒🏪 | Revenue summary, status breakdown, top products, 14-day trend |

### Chat
| Method | Endpoint                | Description                          |
|--------|----------------------------|----------------------------------------|
| POST   | `/chat/send` 🔒             | Send a message                       |
| GET    | `/chat/:userId` 🔒          | Get message history with a user      |
| GET    | `/chat/contacts/list` 🔒    | List existing conversation contacts  |
| GET    | `/chat/users/browse` 🔒     | List users available to start a chat |

### Profile
| Method | Endpoint              | Description               |
|--------|--------------------------|------------------------------|
| GET    | `/profile` 🔒             | Get current user's profile |
| PUT    | `/profile` 🔒             | Update profile info        |
| PUT    | `/profile/password` 🔒    | Change password            |

## Data Model

- **User** — name, email, mobile, address, businessName, role (`shopkeeper` \| `wholesaler`), hashed password
- **Product** — name, description, image, price, stock, lowStockThreshold, unit, category, belongs to a wholesaler (User)
- **Order** — belongs to a shopkeeper and a wholesaler, status, deliveryAddress, note, totalAmount, has many OrderItems
- **OrderItem** — belongs to an Order and a Product; stores quantity and price *at the time of the order*, so later price changes don't rewrite history
- **Message** — sender, receiver, text, timestamp
- **Notification** — belongs to a user, type, title, message, linked orderId, read/unread

Order placement runs inside a **Sequelize transaction** — if any item write
fails, the whole order rolls back. Both order placement and status updates
trigger a real-time notification to the other party via Socket.IO.

### Stock lifecycle

- **Placing an order** row-locks each product (`SELECT ... FOR UPDATE`
  within the transaction), verifies sufficient stock, and decrements it —
  so stock is reserved immediately rather than only checked at
  fulfillment, and two concurrent orders can't both succeed on the same
  last units.
- **Rejecting an order** restores the quantities it had reserved.
- After any stock change, a `product_stock_updated` Socket.IO event is
  broadcast to all connected clients, and the wholesaler receives a
  notification if the product is now at or below `lowStockThreshold`
  (default 5) or at zero.

## Future Scope

- [ ] **Smart reorder suggestions for shopkeepers** — track each shopkeeper's past orders per product to learn their typical reorder interval (e.g. rice every ~12 days), then proactively prompt them ("you're due to reorder rice") before they run out, instead of waiting for them to notice and search manually
- [ ] **Price/demand anomaly detection** — compare a wholesaler's listed price against others in the same category to flag ones that are unusually high or low, and monitor order volume per product to catch sudden spikes (e.g. hoarding ahead of a festival) so wholesalers can react to demand shifts early
- [ ] **AI assistant over the existing chat infrastructure** — extend `chatRoutes.js`/the `Message` model so shopkeepers can ask natural-language questions ("which wholesalers have onions in stock") and get an answer pulled from the live product catalog, instead of manually browsing or messaging each wholesaler

## License

This project is available for personal and academic use.