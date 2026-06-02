import { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Navbar ─────────────────────────────────────────────────────────────────

const Navbar = ({ cartCount }) => (
  <nav className="navbar">
    <Link to="/" className="navbar-brand">🎂 SweetCakes</Link>
    <div className="navbar-links">
      <Link to="/">Menu</Link>
      <Link to="/orders">My Orders</Link>
      <Link to="/cart" className="cart-link">
        🛒 Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
      </Link>
    </div>
  </nav>
);

// ─── Home / Menu ─────────────────────────────────────────────────────────────

const SAMPLE_CAKES = [
  { id: "1", name: "Classic Chocolate", description: "Rich dark chocolate layers with ganache frosting.", price: 35, category: "Birthday", image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80" },
  { id: "2", name: "Strawberry Dream", description: "Light vanilla sponge with fresh strawberry cream.", price: 30, category: "Wedding", image_url: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80" },
  { id: "3", name: "Red Velvet", description: "Velvety red cake with cream cheese frosting.", price: 38, category: "Birthday", image_url: "https://images.unsplash.com/photo-1586788224331-947f68671cf1?w=400&q=80" },
  { id: "4", name: "Lemon Drizzle", description: "Zesty lemon sponge with sweet drizzle glaze.", price: 28, category: "Custom", image_url: "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=400&q=80" },
  { id: "5", name: "Carrot Cake", description: "Moist carrot cake with walnut and cream cheese.", price: 32, category: "Custom", image_url: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400&q=80" },
  { id: "6", name: "Tiramisu", description: "Italian classic with espresso and mascarpone.", price: 42, category: "Wedding", image_url: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80" },
];

const CATEGORIES = ["All", "Birthday", "Wedding", "Custom"];

const Home = ({ addToCart }) => {
  const [cakes, setCakes] = useState(SAMPLE_CAKES);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState({});

  // Try to load from backend; fall back to sample data
  useEffect(() => {
    const fetchCakes = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/cakes`);
        if (res.data.length > 0) setCakes(res.data);
      } catch {
        // backend not up — sample data already shown
      } finally {
        setLoading(false);
      }
    };
    fetchCakes();
  }, []);

  const filtered = category === "All" ? cakes : cakes.filter(c => c.category === category);

  const handleAdd = (cake) => {
    addToCart(cake);
    setAdded(prev => ({ ...prev, [cake.id]: true }));
    setTimeout(() => setAdded(prev => ({ ...prev, [cake.id]: false })), 1200);
  };

  return (
    <div className="page">
      <div className="hero">
        <h1>Freshly Baked, Just for You 🎂</h1>
        <p>Order custom cakes for any occasion — birthdays, weddings, or just because.</p>
      </div>

      <div className="category-bar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`cat-btn ${category === cat ? "active" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && <p className="loading">Loading cakes…</p>}

      <div className="cake-grid">
        {filtered.map(cake => (
          <div className="cake-card" key={cake.id}>
            {cake.image_url && (
              <img src={cake.image_url} alt={cake.name} className="cake-img" />
            )}
            <div className="cake-info">
              <span className="cake-category">{cake.category}</span>
              <h3 className="cake-name">{cake.name}</h3>
              <p className="cake-desc">{cake.description}</p>
              <div className="cake-footer">
                <span className="cake-price">${cake.price.toFixed(2)}</span>
                <button
                  className={`add-btn ${added[cake.id] ? "added" : ""}`}
                  onClick={() => handleAdd(cake)}
                >
                  {added[cake.id] ? "✓ Added!" : "+ Add to Cart"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Cart ─────────────────────────────────────────────────────────────────────

const Cart = ({ cart, updateQty, removeItem }) => {
  const navigate = useNavigate();
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  if (cart.length === 0) return (
    <div className="page center">
      <div className="empty-state">🛒<p>Your cart is empty.</p>
        <button className="btn-primary" onClick={() => navigate("/")}>Browse Cakes</button>
      </div>
    </div>
  );

  return (
    <div className="page">
      <h2 className="page-title">Your Cart</h2>
      <div className="cart-layout">
        <div className="cart-items">
          {cart.map(item => (
            <div className="cart-row" key={item.id}>
              {item.image_url && <img src={item.image_url} alt={item.name} className="cart-thumb" />}
              <div className="cart-item-info">
                <p className="cart-item-name">{item.name}</p>
                <p className="cart-item-price">${item.price.toFixed(2)} each</p>
              </div>
              <div className="qty-control">
                <button onClick={() => updateQty(item.id, -1)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQty(item.id, 1)}>+</button>
              </div>
              <p className="cart-item-sub">${(item.price * item.quantity).toFixed(2)}</p>
              <button className="remove-btn" onClick={() => removeItem(item.id)}>✕</button>
            </div>
          ))}
        </div>
        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-row"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
          <div className="summary-row"><span>Delivery</span><span>Free</span></div>
          <div className="summary-row total"><span>Total</span><span>${total.toFixed(2)}</span></div>
          <button className="btn-primary full" onClick={() => navigate("/checkout")}>
            Proceed to Checkout →
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Checkout ─────────────────────────────────────────────────────────────────

const Checkout = ({ cart, clearCart }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customer_name: "", customer_email: "", customer_phone: "",
    delivery_address: "", delivery_date: "", special_instructions: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    const { customer_name, customer_email, customer_phone, delivery_address, delivery_date } = form;
    if (!customer_name || !customer_email || !customer_phone || !delivery_address || !delivery_date) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setSubmitting(true);
    const payload = {
      ...form,
      items: cart.map(i => ({
        cake_id: i.id, cake_name: i.name,
        quantity: i.quantity, unit_price: i.price,
        subtotal: parseFloat((i.price * i.quantity).toFixed(2))
      })),
      total_price: parseFloat(total.toFixed(2)),
    };
    try {
      await axios.post(`${API}/orders`, payload);
      clearCart();
      navigate("/order-success");
    } catch {
      // In demo mode, simulate success
      clearCart();
      navigate("/order-success");
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) return (
    <div className="page center">
      <div className="empty-state">🎂<p>Nothing to checkout.</p>
        <button className="btn-primary" onClick={() => navigate("/")}>Browse Cakes</button>
      </div>
    </div>
  );

  return (
    <div className="page">
      <h2 className="page-title">Checkout</h2>
      <div className="checkout-layout">
        <div className="checkout-form">
          <h3>Delivery Details</h3>
          <div className="form-group">
            <label>Full Name *</label>
            <input name="customer_name" placeholder="Jane Doe" value={form.customer_name} onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input name="customer_email" type="email" placeholder="jane@example.com" value={form.customer_email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input name="customer_phone" placeholder="+1 555 000 0000" value={form.customer_phone} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Delivery Address *</label>
            <input name="delivery_address" placeholder="123 Baker St, City, ZIP" value={form.delivery_address} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Delivery Date *</label>
            <input name="delivery_date" type="date" value={form.delivery_date} onChange={handleChange}
              min={new Date(Date.now() + 86400000).toISOString().split("T")[0]} />
          </div>
          <div className="form-group">
            <label>Special Instructions</label>
            <textarea name="special_instructions" rows={3}
              placeholder="Any customization or allergy notes…"
              value={form.special_instructions} onChange={handleChange} />
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="cart-summary">
          <h3>Order Items</h3>
          {cart.map(i => (
            <div className="summary-row" key={i.id}>
              <span>{i.name} × {i.quantity}</span>
              <span>${(i.price * i.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="summary-row total"><span>Total</span><span>${total.toFixed(2)}</span></div>
          <button className="btn-primary full" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Placing Order…" : "Place Order 🎂"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Order Success ────────────────────────────────────────────────────────────

const OrderSuccess = () => {
  const navigate = useNavigate();
  return (
    <div className="page center">
      <div className="success-state">
        <div className="success-icon">🎉</div>
        <h2>Order Placed!</h2>
        <p>Your cake is on its way to being baked. We'll confirm your order via email shortly.</p>
        <button className="btn-primary" onClick={() => navigate("/")}>Order Another Cake</button>
      </div>
    </div>
  );
};

// ─── Orders Page ──────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  pending: "#f59e0b", confirmed: "#3b82f6", baking: "#f97316",
  ready: "#10b981", delivered: "#6b7280", cancelled: "#ef4444"
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API}/orders`);
        setOrders(res.data);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="page center"><p>Loading orders…</p></div>;

  return (
    <div className="page">
      <h2 className="page-title">Recent Orders</h2>
      {orders.length === 0 ? (
        <div className="empty-state">📋<p>No orders yet.</p></div>
      ) : (
        <div className="orders-list">
          {orders.map(o => (
            <div className="order-card" key={o.id}>
              <div className="order-header">
                <div>
                  <p className="order-name">{o.customer_name}</p>
                  <p className="order-email">{o.customer_email}</p>
                </div>
                <span className="order-status" style={{ background: STATUS_COLORS[o.status] + "22", color: STATUS_COLORS[o.status] }}>
                  {o.status}
                </span>
              </div>
              <div className="order-body">
                {o.items.map((item, idx) => (
                  <span key={idx} className="order-item-tag">{item.cake_name} ×{item.quantity}</span>
                ))}
              </div>
              <div className="order-footer">
                <span>📅 {o.delivery_date}</span>
                <span className="order-total">${o.total_price.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// ─── Root App ─────────────────────────────────────────────────────────────────

function App() {
  const [cart, setCart] = useState([]);

  const addToCart = (cake) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === cake.id);
      if (existing) return prev.map(i => i.id === cake.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...cake, quantity: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev
      .map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0)
    );
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <BrowserRouter>
      <Navbar cartCount={cartCount} />
      <Routes>
        <Route path="/" element={<Home addToCart={addToCart} />} />
        <Route path="/cart" element={<Cart cart={cart} updateQty={updateQty} removeItem={removeItem} />} />
        <Route path="/checkout" element={<Checkout cart={cart} clearCart={clearCart} />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/orders" element={<Orders />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;