import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const statusClass = {
  Pending: 'status-pending',
  Accepted: 'status-accepted',
  Rejected: 'status-rejected',
  Dispatched: 'status-dispatched',
  Delivered: 'status-delivered',
};

// ---- Order Detail Modal ----
const OrderDetailModal = ({ order, isWholesaler, onClose, onStatusChange }) => {
  const [loading, setLoading] = useState(false);

  const handleStatus = async (newStatus) => {
    setLoading(true);
    try {
      const res = await API.put(`/orders/${order._id}/status`, { status: newStatus });
      onStatusChange(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Determine next allowed action for wholesaler
  const nextActions = () => {
    if (!isWholesaler) return [];
    switch (order.status) {
      case 'Pending': return [
        { label: '✅ Accept', status: 'Accepted', cls: 'btn-success' },
        { label: '❌ Reject', status: 'Rejected', cls: 'btn-danger' },
      ];
      case 'Accepted': return [{ label: '🚚 Mark Dispatched', status: 'Dispatched', cls: 'btn-primary' }];
      case 'Dispatched': return [{ label: '📬 Mark Delivered', status: 'Delivered', cls: 'btn-success' }];
      default: return [];
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '580px', width: '95%' }}>
        <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>

        {/* Status */}
        <div style={{ margin: '12px 0 20px' }}>
          <span className={`status-badge ${statusClass[order.status]}`}>{order.status}</span>
          <span style={{ color: '#64748b', fontSize: '13px', marginLeft: '12px' }}>
            {new Date(order.createdAt).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Parties */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>SHOPKEEPER</div>
            <div style={{ fontWeight: 600 }}>{order.shopkeeperName}</div>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>WHOLESALER</div>
            <div style={{ fontWeight: 600 }}>{order.wholesalerName}</div>
          </div>
        </div>

        {/* Items */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>ORDER ITEMS</div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < order.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{item.productName}</span>
                  <span style={{ color: '#64748b', fontSize: '13px' }}> × {item.quantity} {item.unit}</span>
                </div>
                <div style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f0f4ff', fontWeight: 700 }}>
              <span>Total</span>
              <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Delivery info */}
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
          📍 <strong>Delivery:</strong> {order.deliveryAddress}
        </div>
        {order.note && (
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            📝 <strong>Note:</strong> {order.note}
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
          {nextActions().map((action) => (
            <button key={action.status} className={`btn ${action.cls}`} onClick={() => handleStatus(action.status)} disabled={loading}>
              {loading ? 'Updating...' : action.label}
            </button>
          ))}
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
    setOrders(orders.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
    setSelectedOrder(updatedOrder);
  };

  const filtered = filterStatus === 'All' ? orders : orders.filter((o) => o.status === filterStatus);

  const statuses = ['All', 'Pending', 'Accepted', 'Rejected', 'Dispatched', 'Delivered'];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <h1 className="page-title">{isWholesaler ? '📋 Incoming Orders' : '📦 My Orders'}</h1>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                background: filterStatus === s ? '#2563eb' : '#f1f5f9',
                color: filterStatus === s ? 'white' : '#475569',
              }}
            >
              {s} {s !== 'All' && <span style={{ marginLeft: '4px' }}>({orders.filter((o) => o.status === s).length})</span>}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="card">
          {loading ? (
            <p style={{ color: '#94a3b8', padding: '20px' }}>Loading orders...</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
              <p>No orders in this category</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>{isWholesaler ? 'Shopkeeper' : 'Wholesaler'}</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <tr key={order._id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        #{order._id.slice(-6).toUpperCase()}
                      </td>
                      <td>{isWholesaler ? order.shopkeeperName : order.wholesalerName}</td>
                      <td style={{ color: '#64748b', fontSize: '13px' }}>
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </td>
                      <td style={{ fontWeight: 600 }}>₹{order.totalAmount}</td>
                      <td>
                        <span className={`status-badge ${statusClass[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '13px' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <button
                          className="btn btn-outline"
                          style={{ fontSize: '12px', padding: '5px 12px' }}
                          onClick={() => setSelectedOrder(order)}
                        >
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
