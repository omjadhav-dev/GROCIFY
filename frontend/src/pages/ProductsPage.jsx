import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  Search, Plus, Pencil, Trash2, ShoppingCart, X, CheckCircle2, AlertTriangle, PackageOpen,
  Carrot, Apple, Milk, Wheat, Flame, CupSoda, Popcorn, Package,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const categoryIcon = (cat) => {
  const map = {
    Vegetables: Carrot,
    Fruits: Apple,
    Dairy: Milk,
    Grains: Wheat,
    Spices: Flame,
    Beverages: CupSoda,
    Snacks: Popcorn,
    General: Package,
  };
  return map[cat] || Package;
};

// ---- Wholesaler: Add/Edit Product Modal ----
const ProductModal = ({ product, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    stock: product?.stock || '',
    lowStockThreshold: product?.lowStockThreshold ?? 5,
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
    if (!file.type.startsWith('image/')) return setError('Please select an image file');
    if (file.size > 5 * 1024 * 1024) return setError('Image must be smaller than 5MB');

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
        data.append('removeImage', 'true');
      }

      const res = product ? await API.put(`/products/${product.id}`, data) : await API.post('/products', data);
      onSave(res.data, !!product);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">{product ? 'Edit Product' : 'Add New Product'}</h3>
        {error && (
          <p className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            <AlertTriangle size={15} /> {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Product Name *</label>
            <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Basmati Rice" required />
          </div>
          <div>
            <label className="form-label">Description</label>
            <input className="form-input" name="description" value={form.description} onChange={handleChange} placeholder="Optional description" />
          </div>
          <div>
            <label className="form-label">Product Image</label>
            {imagePreview ? (
              <div className="flex items-center gap-3">
                <img src={imagePreview} alt="Preview" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                <button type="button" className="btn-outline px-3 py-1.5 text-xs" onClick={handleRemoveImage}>
                  <X size={13} /> Remove
                </button>
              </div>
            ) : (
              <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Price (₹) *</label>
              <input className="form-input" name="price" type="number" value={form.price} onChange={handleChange} placeholder="0" min="0" required />
            </div>
            <div>
              <label className="form-label">Stock *</label>
              <input className="form-input" name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="0" min="0" required />
            </div>
          </div>
          <div>
            <label className="form-label">Low stock alert threshold</label>
            <input className="form-input" name="lowStockThreshold" type="number" value={form.lowStockThreshold} onChange={handleChange} placeholder="5" min="0" />
            <p className="mt-1 text-xs text-slate-400">You'll get an alert when stock drops to this number or below.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Unit</label>
              <select className="form-input" name="unit" value={form.unit} onChange={handleChange}>
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
            <div>
              <label className="form-label">Category</label>
              <select className="form-input" name="category" value={form.category} onChange={handleChange}>
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
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
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
        items: [{ productId: product.id, quantity: Number(qty) }],
        wholesalerId: product.wholesaler?.id || product.wholesalerId,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {success ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto mb-3 text-leaf-600" size={48} />
            <h3 className="mb-1 text-lg font-semibold text-slate-900">Order Placed!</h3>
            <p className="mb-5 text-sm text-slate-500">Your order has been sent to the wholesaler.</p>
            <button className="btn-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-slate-900">Place Order — {product.name}</h3>
            <p className="mb-4 mt-1 text-sm text-slate-500">
              ₹{product.price} per {product.unit} · Available: {product.stock} {product.unit}s
            </p>
            {error && (
              <p className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertTriangle size={15} /> {error}
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label className="form-label">Quantity ({product.unit})</label>
                <input className="form-input" type="number" min="1" max={product.stock} value={qty} onChange={(e) => setQty(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Delivery Address</label>
                <input className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter delivery address" />
              </div>
              <div>
                <label className="form-label">Note (optional)</label>
                <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any special instructions?" />
              </div>
              <div className="rounded-lg bg-leaf-50 px-4 py-3 text-sm font-semibold text-leaf-800">
                Total: ₹{(product.price * qty).toFixed(2)}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-outline" onClick={onClose}>Cancel</button>
              <button className="btn-primary" onClick={handleOrder} disabled={loading}>
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

  // Live stock sync: whenever anyone's order changes a product's stock
  // (placed, rejected, etc.), reflect it here immediately without a reload —
  // so a shopkeeper never places an order for something that just sold out,
  // and a wholesaler sees the count tick down in real time.
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on('product_stock_updated', ({ productId, stock }) => {
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock } : p)));
    });
    return () => socket.disconnect();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await API.delete(`/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSave = (savedProduct, isEdit) => {
    if (isEdit) {
      setProducts(products.map((p) => (p.id === savedProduct.id ? savedProduct : p)));
    } else {
      setProducts([savedProduct, ...products]);
    }
    setShowAddModal(false);
    setEditProduct(null);
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-cream-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold text-slate-900">
            {isWholesaler ? 'My Products' : 'Browse Products'}
          </h1>
          {isWholesaler && (
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add Product
            </button>
          )}
        </div>

        <div className="relative mb-5 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input rounded-full pl-10"
          />
        </div>

        {loading ? (
          <p className="text-slate-400">Loading products...</p>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <PackageOpen className="mx-auto mb-3" size={44} />
            <p>{isWholesaler ? 'No products yet. Add your first product!' : 'No products found.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => {
              const CatIcon = categoryIcon(product.category);
              return (
                <div className="card overflow-hidden !p-0" key={product.id}>
                  <div className="flex h-36 items-center justify-center bg-leaf-50 text-leaf-500">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <CatIcon size={44} strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-slate-900">{product.name}</div>
                      {isWholesaler && product.stock === 0 && (
                        <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Out of stock</span>
                      )}
                      {isWholesaler && product.stock > 0 && product.stock <= product.lowStockThreshold && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Low stock</span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-leaf-700">₹{product.price} / {product.unit}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Stock: {product.stock} {product.unit}s
                      {!isWholesaler && <span> · {product.wholesalerName}</span>}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {product.category}
                      {product.description && <div className="mt-1">{product.description}</div>}
                    </div>
                    <div className="mt-3 flex gap-2">
                      {isWholesaler ? (
                        <>
                          <button className="btn-outline flex-1 px-3 py-1.5 text-xs" onClick={() => setEditProduct(product)}>
                            <Pencil size={13} /> Edit
                          </button>
                          <button className="btn-danger flex-1 px-3 py-1.5 text-xs" onClick={() => handleDelete(product.id)}>
                            <Trash2 size={13} /> Delete
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn-primary w-full px-3 py-1.5 text-xs"
                          onClick={() => setOrderProduct(product)}
                          disabled={product.stock === 0}
                        >
                          {product.stock === 0 ? 'Out of Stock' : (<><ShoppingCart size={13} /> Order Now</>)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(showAddModal || editProduct) && (
        <ProductModal
          product={editProduct}
          onClose={() => { setShowAddModal(false); setEditProduct(null); }}
          onSave={handleSave}
        />
      )}
      {orderProduct && <OrderModal product={orderProduct} onClose={() => setOrderProduct(null)} />}
    </div>
  );
};

export default ProductsPage;
