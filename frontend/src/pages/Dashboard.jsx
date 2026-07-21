import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          API.get('/orders/my'),
          user.type === 'wholesaler' ? API.get('/products/my') : API.get('/products'),
        ]);
        setOrders(ordersRes.data);
        setProducts(productsRes.data);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.type]);

  // Count orders by status
  const countByStatus = (status) => orders.filter((o) => o.status === status).length;
  const totalRevenue = orders
    .filter((o) => o.status === 'Delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const shopkeeperStats = [
    { label: 'Total Orders', value: orders.length, icon: '📦', color: '#2563eb' },
    { label: 'Pending Orders', value: countByStatus('Pending'), icon: '⏳', color: '#f59e0b' },
    { label: 'Delivered', value: countByStatus('Delivered'), icon: '✅', color: '#16a34a' },
    { label: 'Amount Spent', value: `₹${totalRevenue.toFixed(0)}`, icon: '💰', color: '#7c3aed' },
  ];

  const wholesalerStats = [
    { label: 'My Products', value: products.length, icon: '🛍️', color: '#2563eb' },
    { label: 'New Orders', value: countByStatus('Pending'), icon: '📬', color: '#f59e0b' },
    { label: 'Orders Dispatched', value: countByStatus('Dispatched'), icon: '🚚', color: '#0891b2' },
    { label: 'Revenue Earned', value: `₹${totalRevenue.toFixed(0)}`, icon: '💰', color: '#16a34a' },
  ];

  const stats = user.type === 'wholesaler' ? wholesalerStats : shopkeeperStats;

  // Recent 5 orders
  const recentOrders = orders.slice(0, 5);

  const statusClass = {
    Pending: 'status-pending',
    Accepted: 'status-accepted',
    Rejected: 'status-rejected',
    Dispatched: 'status-dispatched',
    Delivered: 'status-delivered',
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        {/* Welcome */}
        <div style={{ marginBottom: '28px' }}>
          <h1 className="page-title">
            👋 Welcome back, {user.name}!
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            {user.type === 'wholesaler'
              ? 'Here is an overview of your business activity.'
              : 'Here is a summary of your orders and activity.'}
          </p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <p style={{ color: '#94a3b8' }}>Loading stats...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {stats.map((stat) => (
              <div className="card" key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '12px',
                  background: stat.color + '20', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0
                }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Orders */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Recent Orders</h2>
            <button className="btn btn-outline" style={{ fontSize: '13px', padding: '6px 14px' }} onClick={() => navigate('/orders')}>
              View All
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>{user.type === 'wholesaler' ? 'Shopkeeper' : 'Wholesaler'}</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id} style={{ cursor: 'pointer' }} onClick={() => navigate('/orders')}>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        #{order._id.slice(-6).toUpperCase()}
                      </td>
                      <td>{user.type === 'wholesaler' ? order.shopkeeperName : order.wholesalerName}</td>
                      <td style={{ fontWeight: 600 }}>₹{order.totalAmount}</td>
                      <td>
                        <span className={`status-badge ${statusClass[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '13px' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
          {user.type === 'shopkeeper' ? (
            <>
              <button className="btn btn-primary" onClick={() => navigate('/products')}>
                🛒 Browse Products
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/chat')}>
                💬 Message Wholesaler
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={() => navigate('/products')}>
                ➕ Add Product
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/orders')}>
                📋 Manage Orders
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
