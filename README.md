# 🎂 SweetCakes — Cake Ordering Website

A full-stack cake ordering web application built with **FastAPI** (Python) for the backend and **React** for the frontend, using **MongoDB** as the database.

---

## 📁 Project Structure

```
cake-order-website/
├── backend/
│   ├── server.py          # FastAPI app — all API routes
│   ├── requirements.txt   # Python dependencies
│   └── .env               # Environment variables (you create this)
│
└── frontend/
    ├── public/
    │   └── index.html     # HTML entry point
    ├── src/
    │   ├── App.js         # Main React app + all pages
    │   ├── App.css        # All styles
    │   └── index.js       # React entry point
    ├── package.json       # Node dependencies
    ├── craco.config.js    # Craco config (empty is fine)
    └── .env               # Frontend environment variables (you create this)
```

---

## ✅ Prerequisites

Make sure these are installed on your machine before starting:

| Tool | Version | Check |
|------|---------|-------|
| Python | 3.10+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 8+ | `npm --version` |
| MongoDB | 6+ | `mongod --version` |

### Install MongoDB

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Linux:**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

**Windows:**
Download from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) and run the installer.

---

## 🚀 Getting Started

You need **two terminals open** at the same time — one for the backend, one for the frontend.

---

### Terminal 1 — Backend Setup

```bash
# 1. Go into the backend folder
cd backend

# 2. Create a Python virtual environment
python -m venv venv

# 3. Activate it
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows

# 4. Install all Python packages
pip install -r requirements.txt

# 5. Create the .env file (copy-paste this exactly)
cat > .env << 'EOF'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="cakedb"
CORS_ORIGINS="http://localhost:3000"
EOF

# 6. Start the backend server
uvicorn server:app --reload --port 8000
```

✅ Backend is running when you see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

---

### Terminal 2 — Frontend Setup

```bash
# 1. Go into the frontend folder
cd frontend

# 2. Create the .env file
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=http://localhost:8000
EOF

# 3. Create craco config if it doesn't exist
echo "module.exports = {};" > craco.config.js

# 4. Install packages
npm install --legacy-peer-deps

# 5. Start the frontend
npm start
```

✅ Frontend is running when your browser opens at `http://localhost:3000`

---

## 🌐 URLs

| URL | What it is |
|-----|-----------|
| `http://localhost:3000` | The website (React frontend) |
| `http://localhost:8000/api/` | API root — health check |
| `http://localhost:8000/docs` | Interactive API docs (Swagger UI) — great for testing! |
| `http://localhost:8000/redoc` | Alternative API docs |

---

## 📄 Pages

| Page | Route | Description |
|------|-------|-------------|
| Menu | `/` | Browse all cakes, filter by category, add to cart |
| Cart | `/cart` | View cart, adjust quantities, remove items |
| Checkout | `/checkout` | Fill delivery details and place order |
| Order Success | `/order-success` | Confirmation screen after placing order |
| Orders | `/orders` | View all past orders with status |

---

## 🔌 API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/` | Health check |

### Cakes (Menu)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cakes` | List all cakes (supports `?category=Birthday`) |
| GET | `/api/cakes/{id}` | Get a single cake |
| POST | `/api/cakes` | Add a new cake to the menu |
| PUT | `/api/cakes/{id}` | Update a cake |
| DELETE | `/api/cakes/{id}` | Delete a cake |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place a new order |
| GET | `/api/orders` | List all orders (supports `?status=pending`) |
| GET | `/api/orders/{id}` | Get a single order |
| PATCH | `/api/orders/{id}/status` | Update order status |
| DELETE | `/api/orders/{id}` | Cancel an order |

### Order Status Flow
```
pending → confirmed → baking → ready → delivered
                                     ↘ cancelled
```

---

## 🗄️ Data Models

### Cake
```json
{
  "id": "uuid",
  "name": "Classic Chocolate",
  "description": "Rich dark chocolate layers with ganache frosting.",
  "price": 35.00,
  "category": "Birthday",
  "image_url": "https://...",
  "available": true
}
```

### Order
```json
{
  "id": "uuid",
  "customer_name": "Jane Doe",
  "customer_email": "jane@example.com",
  "customer_phone": "+1 555 000 0000",
  "delivery_address": "123 Baker St, City, ZIP",
  "delivery_date": "2025-02-14",
  "special_instructions": "Write Happy Birthday on top",
  "items": [
    {
      "cake_id": "uuid",
      "cake_name": "Classic Chocolate",
      "quantity": 1,
      "unit_price": 35.00,
      "subtotal": 35.00
    }
  ],
  "total_price": 35.00,
  "status": "pending"
}
```

---

## 🐛 Common Errors & Fixes

### `craco: not found`
```bash
npm install @craco/craco --legacy-peer-deps
```

### `Config file not found` (craco)
```bash
echo "module.exports = {};" > craco.config.js
```

### `ERESOLVE` / dependency conflict
```bash
npm install --legacy-peer-deps
```

### `Can't resolve '@/App.css'`
```bash
sed -i 's|import "@/App.css"|import "./App.css"|' src/App.js
```

### `Cannot find module 'ajv/dist/compile/codegen'`
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### `Module not found: Can't resolve './App'` (capital letters)
```bash
mv src/app.js src/App.js
mv src/app.css src/App.css
```

### MongoDB connection error
Make sure MongoDB is running:
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongodb
```

### Frontend can't reach backend (CORS error)
Make sure `backend/.env` has:
```
CORS_ORIGINS="http://localhost:3000"
```
And `frontend/.env` has:
```
REACT_APP_BACKEND_URL=http://localhost:8000
```
Then restart both servers.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router, Axios, Tailwind CSS |
| Backend | FastAPI, Python 3.10+ |
| Database | MongoDB (via Motor async driver) |
| Validation | Pydantic v2 |
| Dev Server | Uvicorn (backend), Craco + React Scripts (frontend) |

---

## 💡 Tips

- The `/docs` page at `http://localhost:8000/docs` lets you test all API endpoints directly in the browser — no extra tools needed.
- The frontend works even without the backend running — it falls back to sample cake data so you can still see the UI.
- Always keep both terminals running at the same time. If you close one, that part stops working.
- The `venv` must be **activated** every time you open a new terminal for the backend. You'll see `(venv)` at the start of your prompt when it's active.

---

## 🔮 Planned Features

- [ ] User authentication (login / register)
- [ ] Admin dashboard to manage orders
- [ ] Payment integration (Stripe)
- [ ] Email confirmation on order placement
- [ ] Cake customization (message, size, toppings)

---

## 👨‍💻 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request