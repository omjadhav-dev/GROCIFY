# 🥦 GROCIFY — MERN Stack

B2B Grocery Platform connecting Shopkeepers and Wholesalers.
Converted from Python Flask → MERN (MongoDB, Express, React, Node.js).

---

## 📁 Project Structure

```
grocify-mern/
├── backend/                  ← Express + Node.js API
│   ├── src/
│   │   ├── server.js         ← Entry point + Socket.IO
│   │   ├── models/           ← MongoDB schemas (User, Product, Order, Message)
│   │   ├── routes/           ← API routes (auth, products, orders, chat, profile)
│   │   └── middleware/       ← JWT auth middleware
│   ├── .env                  ← Environment variables
│   └── package.json
│
└── frontend/                 ← React app
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js            ← Routes
    │   ├── index.js          ← Entry point
    │   ├── api.js            ← Axios with JWT
    │   ├── context/
    │   │   └── AuthContext.js ← Global auth state
    │   ├── components/
    │   │   ├── Sidebar.js    ← Navigation sidebar
    │   │   └── ProtectedRoute.js
    │   ├── pages/
    │   │   ├── LandingPage.js
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js
    │   │   ├── Dashboard.js
    │   │   ├── ProductsPage.js
    │   │   ├── OrdersPage.js
    │   │   ├── ChatPage.js
    │   │   └── ProfilePage.js
    │   └── styles/
    │       └── global.css
    └── package.json
```

---

## ⚙️ Prerequisites

- **Node.js** v16 or above
- **MongoDB** running locally on port 27017
- **npm** (comes with Node)

Start MongoDB (if not already running):
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
# or
brew services start mongodb-community
```

---

## 🚀 Setup & Run

### Step 1 — Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on → http://localhost:5000

### Step 2 — Frontend (new terminal)

```bash
cd frontend
npm install
npm start
```

Frontend runs on → http://localhost:3000

---

## 🔑 Environment Variables (`backend/.env`)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/grocify
JWT_SECRET=grocify_super_secret_key_change_this_in_production
```

> ⚠️ Change `JWT_SECRET` to something long and random before deploying.

---

## 🎯 Features

| Feature | Shopkeeper | Wholesaler |
|---------|-----------|------------|
| Register / Login | ✅ | ✅ |
| Browse Products | ✅ | — |
| Place Orders | ✅ | — |
| Track Order Status | ✅ | — |
| Add / Edit / Delete Products | — | ✅ |
| Manage Incoming Orders | — | ✅ |
| Accept / Reject / Dispatch Orders | — | ✅ |
| Real-time Chat (Socket.IO) | ✅ | ✅ |
| Edit Profile | ✅ | ✅ |
| Change Password | ✅ | ✅ |
| Dashboard with Stats | ✅ | ✅ |

---

## 🛣️ API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (pass `type: 'shopkeeper'/'wholesaler'`) |

### Products
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/products` | All logged-in users |
| GET | `/api/products/my` | Wholesaler only |
| POST | `/api/products` | Wholesaler only |
| PUT | `/api/products/:id` | Wholesaler (own products) |
| DELETE | `/api/products/:id` | Wholesaler (own products) |

### Orders
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/orders` | Shopkeeper only |
| GET | `/api/orders/my` | Both (filtered by role) |
| PUT | `/api/orders/:id/status` | Wholesaler only |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/send` | Send a message |
| GET | `/api/chat/:userId` | Get conversation history |
| GET | `/api/chat/contacts/list` | Sidebar contact list |
| GET | `/api/chat/users/browse` | Browse users to chat |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get own profile |
| PUT | `/api/profile` | Update profile |
| PUT | `/api/profile/password` | Change password |

---

## 🧠 Key Concepts (for SDE-1 reference)

- **JWT Auth** — Token generated on login, sent in `Authorization: Bearer <token>` header on every request
- **Role-based access** — Middleware checks `user.type` before allowing wholesaler/shopkeeper-only routes
- **Socket.IO** — Enables real-time chat without polling; server tracks online users by socket ID
- **Mongoose** — ODM for MongoDB; schemas define data shape + validation
- **React Context** — `AuthContext` stores user globally so any component can access it without prop drilling
- **Axios interceptor** — Automatically attaches JWT to every API call so you don't repeat it everywhere
