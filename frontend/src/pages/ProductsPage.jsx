import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  Search, Plus, Pencil, Trash2, ShoppingCart, X, CheckCircle2, AlertTriangle, PackageOpen,
  Carrot, Apple, Milk, Wheat, Flame, CupSoda, Popcorn, Package, Star,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const CATEGORIES = ['General', 'Vegetables', 'Fruits', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Snacks'];

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

const categoryColor = (cat) => {
  const map = {
    Vegetables: 'bg-green-50 text-green-700 border-green-200',
    Fruits:     'bg-orange-50 text-orange-700 border-orange-200',
    Dairy:      'bg-blue-50 text-blue-700 border-blue-200',
    Grains:     'bg-yellow-50 text-yellow-700 border-yellow-200',
    Spices:     'bg-red-50 text-red-700 border-red-200',
    Beverages:  'bg-cyan-50 text-cyan-700 border-cyan-200',
    Snacks:     'bg-purple-50 text-purple-700 border-purple-200',
    General:    'bg-slate-50 text-slate-700 border-slate-200',
  };
  return map[cat] || 'bg-slate-50 text-slate-700 border-slate-200';
};

const emptyVariant = () => ({ _key: Math.random().toString(36).slice(2), label: '', price: '', stock: '', minOrderQty: 1 });

// ---- Wholesaler: Add/Edit Product Modal ----
const ProductModal = ({ product, onClose, onSave }) => {
  // Split packSize (e.g. "500 gm") back into qty + unit for editing
  const parsePackSize = (packSize) => {
    if (!packSize) return { qtyValue: '', qtyUnit: 'gm' };
    const match = packSize.match(/^(\d+\.?\d*)\s*(.+)$/);
    if (match) return { qtyValue: match[1], qtyUnit: match[2].trim() };
    return { qtyValue: packSize, qtyUnit: 'gm' };
  };

  const parsed = parsePackSize(product?.packSize);

  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    stock: product?.stock || '',
    lowStockThreshold: product?.lowStockThreshold ?? 5,
    minOrderQty: product?.minOrderQty ?? 1,
    unit: product?.unit || 'piece',
    category: product?.category || 'General',
    qtyValue: parsed.qtyValue,
    qtyUnit: parsed.qtyUnit,
  });
  const [variants, setVariants] = useState(
    product?.variants?.length
      ? product.variants.map((v) => ({ _key: v.id, label: v.label, price: v.price, stock: v.stock, minOrderQty: v.minOrderQty }))
      : []
  );
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.image || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const updateVariant = (key, field, value) =>
    setVariants(variants.map((v) => (v._key === key ? { ...v, [field]: value } : v)));
  const addVariant = () => setVariants([...variants, emptyVariant()]);
  const removeVariant = (key) => setVariants(variants.filter((v) => v._key !== key));

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
      // Combine qtyValue + qtyUnit into packSize before sending
      const packSize = form.qtyValue ? `${form.qtyValue} ${form.qtyUnit}` : '';

      const data = new FormData();
      const { qtyValue, qtyUnit, ...rest } = form;
      Object.entries({ ...rest, packSize }).forEach(([key, value]) => data.append(key, value));
      data.append(
        'variants',
        JSON.stringify(
          variants
            .filter((v) => v.label.trim() && v.price !== '')
            .map(({ label, price, stock, minOrderQty }) => ({ label: label.trim(), price, stock, minOrderQty }))
        )
      );
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

          {/* Quantity: numeric value + unit side by side */}
          <div>
            <label className="form-label">Quantity per pack</label>
            <div className="flex gap-2">
              <input
                className="form-input"
                name="qtyValue"
                type="number"
                value={form.qtyValue}
                onChange={handleChange}
                placeholder="e.g. 500"
                min="0"
              />
              <select className="form-input w-28 shrink-0" name="qtyUnit" value={form.qtyUnit} onChange={handleChange}>
                <option value="gm">gm</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="L">L</option>
                <option value="piece">piece</option>
                <option value="dozen">dozen</option>
                <option value="packet">packet</option>
                <option value="box">box</option>
              </select>
            </div>
            <p className="mt-1 text-xs text-slate-400">Shown on the product card e.g. "500 gm", "1 kg".</p>
          </div>

          {/* Unit used for stock/pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Stock unit</label>
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
              <p className="mt-1 text-xs text-slate-400">Unit used for stock count and pricing.</p>
            </div>
            <div>
              <label className="form-label">Category</label>
              <select className="form-input" name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
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
          <div>
            <label className="form-label">Minimum order quantity</label>
            <input className="form-input" name="minOrderQty" type="number" value={form.minOrderQty} onChange={handleChange} placeholder="1" min="1" />
            <p className="mt-1 text-xs text-slate-400">Shopkeepers must order at least this many {form.unit}s.</p>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="form-label !mb-0">Pack sizes / variants (optional)</label>
              <button type="button" className="text-xs font-semibold text-leaf-700" onClick={addVariant}>+ Add size</button>
            </div>
            <p className="mb-2 mt-1 text-xs text-slate-400">
              List this product in multiple pack sizes (e.g. 250g, 500g, 1kg), each with its own price and stock.
            </p>
            {variants.map((v) => (
              <div key={v._key} className="mb-2 grid grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-2">
                <input className="form-input" placeholder="Label (e.g. 500g)" value={v.label} onChange={(e) => updateVariant(v._key, 'label', e.target.value)} />
                <input className="form-input" type="number" placeholder="Price" min="0" value={v.price} onChange={(e) => updateVariant(v._key, 'price', e.target.value)} />
                <input className="form-input" type="number" placeholder="Stock" min="0" value={v.stock} onChange={(e) => updateVariant(v._key, 'stock', e.target.value)} />
                <input className="form-input" type="number" placeholder="Min qty" min="1" value={v.minOrderQty} onChange={(e) => updateVariant(v._key, 'minOrderQty', e.target.value)} />
                <button type="button" className="text-slate-400 hover:text-red-600" onClick={() => removeVariant(v._key)}>
                  <X size={16} />
                </button>
              </div>
            ))}
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
  const hasVariants = product.variants && product.variants.length > 0;
  const [variantId, setVariantId] = useState(null);
  const selected = variantId ? product.variants.find((v) => v.id === variantId) : product;

  const [qty, setQty] = useState(selected?.minOrderQty || 1);
  const [note, setNote] = useState('');
  const [address, setAddress] = useState(user?.address || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setQty(selected?.minOrderQty || 1); }, [variantId]);

  const handleOrder = async () => {
    if (qty < (selected?.minOrderQty || 1)) {
      return setError(`Minimum order quantity is ${selected.minOrderQty} ${product.unit}(s)`);
    }
    if (!address.trim()) return setError('Delivery address is required');
    setLoading(true);
    setError('');
    try {
      await API.post('/orders', {
        items: [{ productId: product.id, variantId: variantId || undefined, quantity: Number(qty) }],
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
            <div className="mb-4 flex items-start gap-3">
              {product.image && (
                <img src={product.image} alt={product.name} className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover" />
              )}
              <div>
                <h3 className="text-lg font-semibold leading-tight text-slate-900">{product.name}</h3>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <span>{product.wholesalerName}</span>
                  {product.wholesalerRating?.averageRating != null && (
                    <span className="flex items-center gap-0.5 text-amber-600">
                      <Star size={11} fill="currentColor" /> {product.wholesalerRating.averageRating.toFixed(1)} ({product.wholesalerRating.reviewCount})
                    </span>
                  )}
                </div>
                {product.description && <p className="mt-1 text-xs text-slate-400">{product.description}</p>}
              </div>
            </div>
            <p className="mb-4 text-sm text-slate-500">
              ₹{selected?.price} per {product.unit} · Available: {selected?.stock} {product.unit}s · Min order: {selected?.minOrderQty} {product.unit}(s)
            </p>
            {error && (
              <p className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertTriangle size={15} /> {error}
              </p>
            )}
            <div className="space-y-4">
              {hasVariants && (
                <div>
                  <label className="form-label">Pack size</label>
                  <select
                    className="form-input"
                    value={variantId ?? ''}
                    onChange={(e) => setVariantId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="" disabled={product.stock === 0}>
                      Default — ₹{product.price} {product.stock === 0 ? '(out of stock)' : ''}
                    </option>
                    {product.variants.map((v) => (
                      <option key={v.id} value={v.id} disabled={v.stock === 0}>
                        {v.label} — ₹{v.price} {v.stock === 0 ? '(out of stock)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="form-label">Quantity ({product.unit})</label>
                <input
                  className="form-input"
                  type="number"
                  min={selected?.minOrderQty || 1}
                  max={selected?.stock}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
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
                Total: ₹{((selected?.price || 0) * qty).toFixed(2)}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-outline" onClick={onClose}>Cancel</button>
              <button className="btn-primary" onClick={handleOrder} disabled={loading || selected?.stock === 0}>
                {loading ? 'Placing...' : 'Confirm Order'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ---- Product Card ----
const ProductCard = ({ product, isWholesaler, onEdit, onDelete, onOrder }) => {
  const CatIcon = categoryIcon(product.category);
  const hasVariants = product.variants && product.variants.length > 0;
  const stockUnits = [
    { stock: product.stock, threshold: product.lowStockThreshold },
    ...(product.variants || []).map((v) => ({ stock: v.stock, threshold: v.lowStockThreshold })),
  ];
  const outOfStock = stockUnits.every((u) => u.stock === 0);
  const lowStock = !outOfStock && stockUnits.some((u) => u.stock > 0 && u.stock <= u.threshold);
  const displayPrice = hasVariants
    ? Math.min(product.price, ...product.variants.map((v) => v.price))
    : product.price;

  return (
    <div className="card overflow-hidden !p-0">
      <div className="relative flex h-36 items-center justify-center bg-leaf-50 text-leaf-500">
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <CatIcon size={44} strokeWidth={1.5} />
        )}
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-leaf-700 shadow-sm backdrop-blur-sm">
          <CatIcon size={11} /> {product.category}
        </span>
      </div>
      <div className="p-4">
        <div className="font-semibold text-slate-900">{product.name}</div>
        {product.packSize && <div className="text-xs text-slate-400">{product.packSize}</div>}
        <div className="mt-1 text-base font-bold text-leaf-700">
          {hasVariants ? `From ₹${displayPrice}` : `₹${displayPrice}`}
          <span className="text-xs font-normal text-slate-400"> / {product.unit}</span>
        </div>
        {isWholesaler && (outOfStock || lowStock) && (
          <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${outOfStock ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
            {outOfStock ? 'Out of stock' : 'Low stock'}
          </span>
        )}
        <div className="mt-3 flex gap-2">
          {isWholesaler ? (
            <>
              <button className="btn-outline flex-1 px-3 py-1.5 text-xs" onClick={() => onEdit(product)}>
                <Pencil size={13} /> Edit
              </button>
              <button className="btn-danger flex-1 px-3 py-1.5 text-xs" onClick={() => onDelete(product.id)}>
                <Trash2 size={13} /> Delete
              </button>
            </>
          ) : (
            <button
              className="btn-primary w-full px-3 py-1.5 text-xs"
              onClick={() => onOrder(product)}
              disabled={outOfStock}
            >
              {outOfStock ? 'Out of Stock' : <><ShoppingCart size={13} /> Order Now</>}
            </button>
          )}
        </div>
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
  const [selectedCategory, setSelectedCategory] = useState(null); // null = category grid view
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

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on('product_stock_updated', ({ productId, variantId, stock }) => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          if (variantId) {
            return { ...p, variants: p.variants?.map((v) => (v.id === variantId ? { ...v, stock } : v)) };
          }
          return { ...p, stock };
        })
      );
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

  // Products filtered by search
  const searchFiltered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  // Count per category
  const countByCategory = (cat) => products.filter((p) => p.category === cat).length;

  // Products in selected category (also applying search)
  const categoryProducts = selectedCategory
    ? searchFiltered.filter((p) => p.category === selectedCategory)
    : [];

  // When searching, skip category grid and show all results directly
  const isSearching = search.trim().length > 0;

  return (
    <div className="flex min-h-screen bg-cream-50">
      <Sidebar />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            {selectedCategory && !isSearching ? (
              <div className="flex items-center gap-2">
                <button
                  className="font-display text-2xl font-semibold text-slate-900 hover:text-harvest-600 transition-colors"
                  onClick={() => setSelectedCategory(null)}
                >
                  {isWholesaler ? 'My Products' : 'Browse Products'}
                </button>
                <span className="font-display text-2xl font-semibold text-slate-300">/</span>
                <span className="font-display text-2xl font-semibold text-slate-900">{selectedCategory}</span>
              </div>
            ) : (
              <h1 className="font-display text-2xl font-semibold text-slate-900  hover:text-harvest-600">
                {isSearching ? 'Search Results' : isWholesaler ? 'My Products' : 'Browse Products'}
              </h1>
            )}
          </div>
          {isWholesaler && (
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add Product
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name or category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value.trim()) setSelectedCategory(null);
            }}
            className="form-input rounded-full pl-10"
          />
        </div>

        {loading ? (
          <p className="text-slate-400">Loading products...</p>
        ) : isSearching ? (
          // Search results — flat grid
          searchFiltered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <PackageOpen className="mx-auto mb-3" size={44} />
              <p>No products found for "{search}".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {searchFiltered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isWholesaler={isWholesaler}
                  onEdit={setEditProduct}
                  onDelete={handleDelete}
                  onOrder={setOrderProduct}
                />
              ))}
            </div>
          )
        ) : selectedCategory ? (
          // Products inside a category
          categoryProducts.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <PackageOpen className="mx-auto mb-3" size={44} />
              <p>{isWholesaler ? 'No products in this category yet.' : 'No products found.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categoryProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isWholesaler={isWholesaler}
                  onEdit={setEditProduct}
                  onDelete={handleDelete}
                  onOrder={setOrderProduct}
                />
              ))}
            </div>
          )
        ) : (
          // Category grid
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {CATEGORIES.map((cat) => {
              const CatIcon = categoryIcon(cat);
              const count = countByCategory(cat);
              // For wholesaler show all categories; for shopkeeper hide empty ones
              if (!isWholesaler && count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`card flex flex-col items-center justify-center gap-3 py-8 border transition hover:shadow-md hover:-translate-y-0.5 ${categoryColor(cat)}`}
                >
                  <CatIcon size={36} strokeWidth={1.5} />
                  <div className="text-center">
                    <div className="font-semibold text-sm">{cat}</div>
                    <div className="text-xs opacity-60 mt-0.5">
                      {count} {count === 1 ? 'product' : 'products'}
                    </div>
                  </div>
                </button>
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