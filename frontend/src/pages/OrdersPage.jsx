import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, Truck, PackageCheck, MapPin, StickyNote, PackageOpen,
  Pencil, Trash2, AlertTriangle, Star, Undo2, Plus,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const statusClass = {
  Pending: 'bg-amber-50 text-amber-600',
  Accepted: 'bg-sky-50 text-sky-600',
  Rejected: 'bg-red-50 text-red-600',
  Dispatched: 'bg-indigo-50 text-indigo-600',
  Delivered: 'bg-leaf-50 text-leaf-700',
  Disputed: 'bg-orange-50 text-orange-600',
  Returned: 'bg-slate-100 text-slate-600',
};

const orderCode = (order) => `#${String(order.id).padStart(6, '0')}`;

// ---- Edit Order Items (shopkeeper, while Pending) ----
const EditItemsForm = ({ order, onCancel, onSaved }) => {
  const [items, setItems] = useState((order.items || []).map((i) => ({ ...i })));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Catalog to add more products from — same wholesaler as this order
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [pickProductId, setPickProductId] = useState('');
  const [pickVariantId, setPickVariantId] = useState('');
  const [pickQty, setPickQty] = useState(1);

  useEffect(() => {
    API.get('/products', { params: { wholesaler: order.wholesalerId } })
      .then((res) => setCatalog(res.data))
      .catch(() => setCatalog([]))
      .finally(() => setCatalogLoading(false));
  }, [order.wholesalerId]);

  const pickedProduct = catalog.find((p) => p.id === Number(pickProductId));
  const pickedHasVariants = pickedProduct?.variants && pickedProduct.variants.length > 0;
  // pickVariantId === '' means "the product's own default", same convention as the Order Now modal
  const pickedVariant = pickVariantId ? pickedProduct?.variants.find((v) => v.id === Number(pickVariantId)) : null;

  const updateQty = (idx, qty) => setItems(items.map((it, i) => (i === idx ? { ...it, quantity: qty } : it)));
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const handleAddProduct = () => {
    if (!pickedProduct) return;
    const already = items.find(
      (it) => it.productId === pickedProduct.id && (it.variantId || null) === (pickedVariant?.id || null)
    );
    if (already) return setError('That item is already in this order — adjust its quantity instead');

    setError('');
    setItems([
      ...items,
      {
        productId: pickedProduct.id,
        productName: pickedProduct.name,
        variantId: pickedVariant?.id || null,
        variantLabel: pickedVariant?.label || null,
        quantity: pickQty || (pickedVariant?.minOrderQty ?? pickedProduct.minOrderQty ?? 1),
        unit: pickedProduct.unit,
      },
    ]);
    setPickProductId('');
    setPickVariantId('');
    setPickQty(1);
  };

  const handleSave = async () => {
    if (items.length === 0) return setError('An order must have at least one item');
    setSaving(true);
    setError('');
    try {
      const res = await API.put(`/orders/${order.id}/items`, {
        items: items.map((it) => ({ productId: it.productId, variantId: it.variantId || undefined, quantity: Number(it.quantity) })),
      });
      onSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="mb-2 text-xs font-semibold text-slate-500">EDIT ITEMS</div>
      {error && (
        <p className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertTriangle size={15} /> {error}
        </p>
      )}
      <div className="space-y-2 rounded-lg border border-slate-200 p-3">
        {items.map((item, idx) => (
          <div key={item.id ?? `${item.productId}-${item.variantId ?? 'x'}`} className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium">
              {item.productName}{item.variantLabel ? ` (${item.variantLabel})` : ''}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                className="form-input w-20 py-1 text-sm"
                value={item.quantity}
                onChange={(e) => updateQty(idx, e.target.value)}
              />
              <button className="text-slate-400 hover:text-red-600" onClick={() => removeItem(idx)}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="py-2 text-center text-xs text-slate-400">All items removed — add at least one to save.</p>}
      </div>

      <div className="mt-3 rounded-lg border border-dashed border-slate-300 p-3">
        <div className="mb-2 text-xs font-semibold text-slate-500">ADD A PRODUCT</div>
        {catalogLoading ? (
          <p className="text-xs text-slate-400">Loading catalog...</p>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[9rem] flex-1">
              <select
                className="form-input py-1.5 text-xs"
                value={pickProductId}
                onChange={(e) => { setPickProductId(e.target.value); setPickVariantId(''); }}
              >
                <option value="">Select product...</option>
                {catalog.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {pickedHasVariants && (
              <div className="min-w-[7rem]">
                <select className="form-input py-1.5 text-xs" value={pickVariantId} onChange={(e) => setPickVariantId(e.target.value)}>
                  <option value="">Default — ₹{pickedProduct.price}</option>
                  {pickedProduct.variants.map((v) => (
                    <option key={v.id} value={v.id} disabled={v.stock === 0}>{v.label} — ₹{v.price}</option>
                  ))}
                </select>
              </div>
            )}
            <input
              type="number"
              min="1"
              className="form-input w-20 py-1.5 text-xs"
              value={pickQty}
              onChange={(e) => setPickQty(e.target.value)}
              placeholder="Qty"
            />
            <button className="btn-outline flex items-center gap-1 px-3 py-1.5 text-xs" onClick={handleAddProduct} disabled={!pickProductId}>
              <Plus size={13} /> Add
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button className="btn-outline px-3 py-1.5 text-xs" onClick={onCancel}>Cancel</button>
        <button className="btn-primary px-3 py-1.5 text-xs" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

// ---- Leave a Review (shopkeeper, after Delivered) ----
const ReviewForm = ({ order, onSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await API.post('/reviews', { orderId: order.id, rating, comment });
      onSubmitted(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-4 rounded-lg border border-slate-200 p-3.5">
      <div className="mb-2 text-xs font-semibold text-slate-500">RATE THIS WHOLESALER</div>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <div className="mb-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} type="button">
            <Star size={22} className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
          </button>
        ))}
      </div>
      <input
        className="form-input mb-2 text-sm"
        placeholder="Optional comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button className="btn-primary px-3 py-1.5 text-xs" onClick={handleSubmit} disabled={saving}>
        {saving ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  );
};

// ---- Report an Issue (shopkeeper, after Delivered) ----
const DisputeForm = ({ order, onCancel, onSubmitted }) => {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) return setError('Please describe the issue');
    setSaving(true);
    setError('');
    try {
      const res = await API.put(`/orders/${order.id}/dispute`, { reason });
      onSubmitted(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report issue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50/50 p-3.5">
      <div className="mb-2 text-xs font-semibold text-orange-700">REPORT AN ISSUE</div>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <input
        className="form-input mb-2 text-sm"
        placeholder="e.g. Wrong item received, damaged goods..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <button className="btn-outline px-3 py-1.5 text-xs" onClick={onCancel}>Cancel</button>
        <button className="btn-danger px-3 py-1.5 text-xs" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Submitting...' : 'Submit Report'}
        </button>
      </div>
    </div>
  );
};

// ---- Order Detail Modal ----
const OrderDetailModal = ({ order, isWholesaler, onClose, onStatusChange }) => {
  const [loading, setLoading] = useState(false);
  const [editingItems, setEditingItems] = useState(false);
  const [reportingIssue, setReportingIssue] = useState(false);
  const [existingReview, setExistingReview] = useState(undefined); // undefined = not checked yet

  useEffect(() => {
    if (isWholesaler || order.status !== 'Delivered') return;
    API.get(`/reviews/order/${order.id}`)
      .then((res) => setExistingReview(res.data))
      .catch(() => setExistingReview(null));
  }, [order.id, order.status, isWholesaler]);

  const handleStatus = async (newStatus) => {
    setLoading(true);
    try {
      const res = await API.put(`/orders/${order.id}/status`, { status: newStatus });
      onStatusChange(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (resolution) => {
    setLoading(true);
    try {
      const res = await API.put(`/orders/${order.id}/resolve-dispute`, { resolution });
      onStatusChange(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve dispute');
    } finally {
      setLoading(false);
    }
  };

  const nextActions = () => {
    if (!isWholesaler) return [];
    switch (order.status) {
      case 'Pending':
        return [
          { label: 'Accept', icon: CheckCircle2, status: 'Accepted', cls: 'btn-success' },
          { label: 'Reject', icon: XCircle, status: 'Rejected', cls: 'btn-danger' },
        ];
      case 'Accepted':
        return [{ label: 'Mark Dispatched', icon: Truck, status: 'Dispatched', cls: 'btn-primary' }];
      case 'Dispatched':
        return [{ label: 'Mark Delivered', icon: PackageCheck, status: 'Delivered', cls: 'btn-success' }];
      default:
        return [];
    }
  };

  const canEditItems = !isWholesaler && order.status === 'Pending';
  const canReport = !isWholesaler && order.status === 'Delivered';
  const canReview = !isWholesaler && order.status === 'Delivered' && existingReview === null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Order {orderCode(order)}</h3>

        <div className="my-3 flex items-center gap-3">
          <span className={`status-badge ${statusClass[order.status]}`}>{order.status}</span>
          <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleString('en-IN')}</span>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">Shopkeeper</div>
            <div className="font-semibold text-slate-800">{order.shopkeeperName}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">Wholesaler</div>
            <div className="font-semibold text-slate-800">{order.wholesalerName}</div>
          </div>
        </div>

        {order.status === 'Disputed' && order.disputeReason && (
          <div className="mb-4 rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
            <strong>Reported issue:</strong> {order.disputeReason}
          </div>
        )}

        {canEditItems && editingItems ? (
          <EditItemsForm
            order={order}
            onCancel={() => setEditingItems(false)}
            onSaved={(updated) => { onStatusChange(updated); setEditingItems(false); }}
          />
        ) : (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-500">ORDER ITEMS</div>
              {canEditItems && (
                <button className="flex items-center gap-1 text-xs font-semibold text-leaf-700" onClick={() => setEditingItems(true)}>
                  <Pencil size={12} /> Edit
                </button>
              )}
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              {(order.items || []).map((item, i) => (
                <div
                  key={item.id ?? i}
                  className={`flex justify-between px-3.5 py-2.5 text-sm ${i < order.items.length - 1 ? 'border-b border-slate-100' : ''}`}
                >
                  <div>
                    <span className="font-medium">{item.productName}{item.variantLabel ? ` (${item.variantLabel})` : ''}</span>
                    <span className="text-slate-500"> × {item.quantity} {item.unit}</span>
                  </div>
                  <div className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
              <div className="flex justify-between bg-leaf-50 px-3.5 py-2.5 text-sm font-bold text-leaf-800">
                <span>Total</span>
                <span>₹{Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-2 flex items-start gap-2 text-sm text-slate-500">
          <MapPin size={15} className="mt-0.5 shrink-0" />
          <span><strong className="text-slate-700">Delivery:</strong> {order.deliveryAddress}</span>
        </div>
        {order.note && (
          <div className="mb-4 flex items-start gap-2 text-sm text-slate-500">
            <StickyNote size={15} className="mt-0.5 shrink-0" />
            <span><strong className="text-slate-700">Note:</strong> {order.note}</span>
          </div>
        )}

        {canReview && (
          <ReviewForm order={order} onSubmitted={(review) => setExistingReview(review)} />
        )}
        {existingReview && (
          <div className="mb-4 flex items-center gap-1 text-xs text-slate-500">
            <Star size={13} className="fill-amber-400 text-amber-400" /> You rated this order {existingReview.rating}/5
          </div>
        )}

        {canReport && !reportingIssue && (
          <button className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-orange-700" onClick={() => setReportingIssue(true)}>
            <AlertTriangle size={13} /> Report an issue with this order
          </button>
        )}
        {canReport && reportingIssue && (
          <DisputeForm
            order={order}
            onCancel={() => setReportingIssue(false)}
            onSubmitted={(updated) => { onStatusChange(updated); setReportingIssue(false); }}
          />
        )}

        {isWholesaler && order.status === 'Disputed' && (
          <div className="mb-2 flex flex-wrap justify-end gap-2">
            <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => handleResolveDispute('Delivered')} disabled={loading}>
              Dismiss — keep as Delivered
            </button>
            <button className="btn-danger flex items-center gap-1 px-3 py-1.5 text-xs" onClick={() => handleResolveDispute('Returned')} disabled={loading}>
              <Undo2 size={13} /> Accept Return
            </button>
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button className="btn-outline" onClick={onClose}>Close</button>
          {nextActions().map((action) => {
            const Icon = action.icon;
            return (
              <button key={action.status} className={action.cls} onClick={() => handleStatus(action.status)} disabled={loading}>
                <Icon size={15} /> {loading ? 'Updating...' : action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---- Main Orders Page ----
const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');

  const isWholesaler = user.type === 'wholesaler';

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await API.get('/orders/my');
        setOrders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleStatusChange = (updatedOrder) => {
    setOrders(orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    setSelectedOrder(updatedOrder);
  };

  const filtered = filterStatus === 'All' ? orders : orders.filter((o) => o.status === filterStatus);
  const statuses = ['All', 'Pending', 'Accepted', 'Rejected', 'Dispatched', 'Delivered', 'Disputed', 'Returned'];

  return (
    <div className="flex min-h-screen bg-cream-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="mb-6 font-display text-2xl font-semibold text-slate-900">
          {isWholesaler ? 'Incoming Orders' : 'My Orders'}
        </h1>

        <div className="mb-5 flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === s ? 'bg-leaf-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s} {s !== 'All' && <span className="ml-1">({orders.filter((o) => o.status === s).length})</span>}
            </button>
          ))}
        </div>

        <div className="card !p-0">
          {loading ? (
            <p className="p-5 text-slate-400">Loading orders...</p>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <PackageOpen className="mx-auto mb-3" size={44} />
              <p>No orders in this category</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3 font-medium">Order ID</th>
                    <th className="px-5 py-3 font-medium">{isWholesaler ? 'Shopkeeper' : 'Wholesaler'}</th>
                    <th className="px-5 py-3 font-medium">Items</th>
                    <th className="px-5 py-3 font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((order) => (
                    <tr key={order.id}>
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{orderCode(order)}</td>
                      <td className="px-5 py-3">{isWholesaler ? order.shopkeeperName : order.wholesalerName}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'}
                      </td>
                      <td className="px-5 py-3 font-semibold">₹{order.totalAmount}</td>
                      <td className="px-5 py-3">
                        <span className={`status-badge ${statusClass[order.status]}`}>{order.status}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-5 py-3">
                        <button className="btn-outline px-3 py-1 text-xs" onClick={() => setSelectedOrder(order)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isWholesaler={isWholesaler}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default OrdersPage;
