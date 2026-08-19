import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Truck, PackageCheck, MapPin, StickyNote, PackageOpen } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const statusClass = {
  Pending: 'bg-amber-50 text-amber-600',
  Accepted: 'bg-sky-50 text-sky-600',
  Rejected: 'bg-red-50 text-red-600',
  Dispatched: 'bg-indigo-50 text-indigo-600',
  Delivered: 'bg-leaf-50 text-leaf-700',
};

const orderCode = (order) => `#${String(order.id).padStart(6, '0')}`;

// ---- Order Detail Modal ----
const OrderDetailModal = ({ order, isWholesaler, onClose, onStatusChange }) => {
  const [loading, setLoading] = useState(false);

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

        <div className="mb-4">
          <div className="mb-2 text-xs font-semibold text-slate-500">ORDER ITEMS</div>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            {(order.items || []).map((item, i) => (
              <div
                key={item.id ?? i}
                className={`flex justify-between px-3.5 py-2.5 text-sm ${i < order.items.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                <div>
                  <span className="font-medium">{item.productName}</span>
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
  const statuses = ['All', 'Pending', 'Accepted', 'Rejected', 'Dispatched', 'Delivered'];

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
