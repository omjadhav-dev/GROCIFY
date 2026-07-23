import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import API from '../api';

// Emoji icon for product categories
const categoryIcon = (cat) => {
  const map = { Vegetables: '🥦', Fruits: '🍎', Dairy: '🥛', Grains: '🌾', Spices: '🌶️', Beverages: '🧃', Snacks: '🍿', General: '🛒' };
  return map[cat] || '📦';
};

// ---- Wholesaler: Add/Edit Product Modal ----
const ProductModal = ({ product, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    stock: product?.stock || '',
    unit: product?.unit || 'piece',
    category: product?.category || 'General',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.image || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (imageFile) {
        data.append('image', imageFile);
      } else if (product && !imagePreview) {
        // Existing product, image was cleared by the user
        data.append('removeImage', 'true');
      }

      let res;
      if (product) {
        res = await API.put(`/products/${product._id}`, data);
      } else {
        res = await API.post('/products', data);
      }
      onSave(res.data, !!product);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>{product ? 'Edit Product' : 'Add New Product'}</h3>
        {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>⚠️ {error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Basmati Rice" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input name="description" value={form.description} onChange={handleChange} placeholder="Optional description" />
          </div>
          <div className="form-group">
            <label>Product Image</label>
            {imagePreview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <button type="button" className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={handleRemoveImage}>
                  ✕ Remove
                </button>
              </div>
            ) : (
              <input type="file" accept="image/*" onChange={handleImageChange} />
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Price (₹) *</label>
              <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="0" min="0" required />
            </div>
            <div className="form-group">
              <label>Stock *</label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="0" min="0" required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Unit</label>
              <select name="unit" value={form.unit} onChange={handleChange}>
                <option value="piece">Piece</option>
                <option value="kg">Kg</option>
                <option value="gram">Gram</option>
                <option value="litre">Litre</option>
                <option value="ml">ml</option>
                <option value="dozen">Dozen</option>
                <option value="packet">Packet</option>
                <option value="box">Box</option>
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                <option>General</option>
                <option>Vegetables</option>
                <option>Fruits</option>
                <option>Dairy</option>
                <option>Grains</option>
                <option>Spices</option>
                <option>Beverages</option>
                <option>Snacks</option>
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---- Shopkeeper: Place Order Modal ----
const OrderModal = ({ product, onClose }) => {
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [address, setAddress] = useState(user?.address || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleOrder = async () => {
    if (qty < 1) return setError('Quantity must be at least 1');
    if (!address.trim()) return setError('Delivery address is required');
    setLoading(true);
    setError('');
    try {
      await API.post('/orders', {
        items: [{ productId: product._id, quantity: Number(qty) }],
        wholesalerId: product.wholesaler._id || product.wholesaler,
        deliveryAddress: address,
        note,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        {success ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '50px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ marginBottom: '8px' }}>Order Placed!</h3>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>Your order has been sent to the wholesaler.</p>
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <h3>Place Order — {product.name}</h3>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 16px' }}>
              ₹{product.price} per {product.unit} · Available: {product.stock} {product.unit}s
            </p>
            {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>⚠️ {error}</p>}
            <div className="form-group">
              <label>Quantity ({product.unit})</label>
              <input type="number" min="1" max={product.stock} value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Delivery Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter delivery address" />
            </div>
            <div className="form-group">
              <label>Note (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any special instructions?" />
            </div>
            <div style={{ background: '#f0f4ff', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
              <strong>Total: ₹{(product.price * qty).toFixed(2)}</strong>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleOrder} disabled={loading}>
                {loading ? 'Placing...' : 'Confirm Order'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ---- Main Products Page ----
const ProductsPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [orderProduct, setOrderProduct] = useState(null);

  const isWholesaler = user.type === 'wholesaler';

  const fetchProducts = async () => {
    try {
      const res = isWholesaler ? await API.get('/products/my') : await API.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await API.delete(`/products/${id}`);
      setProducts(products.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSave = (savedProduct, isEdit) => {
    if (isEdit) {
      setProducts(products.map((p) => (p._id === savedProduct._id ? savedProduct : p)));
    } else {
      setProducts([savedProduct, ...products]);
    }
    setShowAddModal(false);
    setEditProduct(null);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            {isWholesaler ? '📦 My Products' : '🛒 Browse Products'}
          </h1>
          {isWholesaler && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              ➕ Add Product
            </button>
          )}
        </div>

        {/* Search */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="🔍 Search by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '10px 16px', border: '1.5px solid #e2e8f0', borderRadius: '25px', width: '100%', maxWidth: '400px', outline: 'none', fontSize: '14px' }}
          />
        </div>

        {/* Products Grid */}
        {loading ? (
          <p style={{ color: '#94a3b8' }}>Loading products...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
            <p>{isWholesaler ? 'No products yet. Add your first product!' : 'No products found.'}</p>
          </div>
        ) : (
          <div className="products-grid">
            {filtered.map((product) => (
              <div className="product-card" key={product._id}>
                <div className="product-card-img">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                    />
                  ) : (
                    categoryIcon(product.category)
                  )}
                </div>
                <div className="product-card-body">
                  <div className="product-card-name">{product.name}</div>
                  <div className="product-card-price">₹{product.price} / {product.unit}</div>
                  <div className="product-card-meta">
                    Stock: {product.stock} {product.unit}s
                    {!isWholesaler && <span> · {product.wholesalerName}</span>}
                  </div>
                  <div className="product-card-meta" style={{ marginBottom: '12px' }}>
                    {product.category}
                    {product.description && <div style={{ marginTop: '4px' }}>{product.description}</div>}
                  </div>
                  <div className="product-card-actions">
                    {isWholesaler ? (
                      <>
                        <button className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => setEditProduct(product)}>
                          ✏️ Edit
                        </button>
                        <button className="btn btn-danger" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => handleDelete(product._id)}>
                          🗑️ Delete
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: '12px', padding: '6px 12px', width: '100%' }}
                        onClick={() => setOrderProduct(product)}
                        disabled={product.stock === 0}
                      >
                        {product.stock === 0 ? 'Out of Stock' : '🛒 Order Now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {(showAddModal || editProduct) && (
        <ProductModal
          product={editProduct}
          onClose={() => { setShowAddModal(false); setEditProduct(null); }}
          onSave={handleSave}
        />
      )}
      {orderProduct && (
        <OrderModal product={orderProduct} onClose={() => setOrderProduct(null)} />
      )}
    </div>
  );
};

export default ProductsPage;
