import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle2, Wallet, ShoppingBag, Inbox, Truck, PackageOpen, ShoppingCart, MessageCircle, PlusCircle, ClipboardList } from 'lucide-react';
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

  const countByStatus = (status) => orders.filter((o) => o.status === status).length;
  const totalRevenue = orders
    .filter((o) => o.status === 'Delivered')
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  const shopkeeperStats = [
    { label: 'Total Orders', value: orders.length, icon: Package, color: 'text-harvest-500 bg-harvest-50' },
    { label: 'Pending Orders', value: countByStatus('Pending'), icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Delivered', value: countByStatus('Delivered'), icon: CheckCircle2, color: 'text-leaf-700 bg-leaf-50' },
    { label: 'Amount Spent', value: `₹${totalRevenue.toFixed(0)}`, icon: Wallet, color: 'text-violet-600 bg-violet-50' },
  ];

  const wholesalerStats = [
    { label: 'My Products', value: products.length, icon: ShoppingBag, color: 'text-harvest-500 bg-harvest-50' },
    { label: 'New Orders', value: countByStatus('Pending'), icon: Inbox, color: 'text-amber-600 bg-amber-50' },
    { label: 'Orders Dispatched', value: countByStatus('Dispatched'), icon: Truck, color: 'text-cyan-600 bg-cyan-50' },
    { label: 'Revenue Earned', value: `₹${totalRevenue.toFixed(0)}`, icon: Wallet, color: 'text-leaf-700 bg-leaf-50' },
  ];

  const stats = user.type === 'wholesaler' ? wholesalerStats : shopkeeperStats;
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-7">
          <h1 className="font-display text-2xl font-semibold text-slate-900">Welcome back, {user.name}!</h1>
          <p className="text-sm text-slate-500">
            {user.type === 'wholesaler'
              ? 'Here is an overview of your business activity.'
              : 'Here is a summary of your orders and activity.'}
          </p>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading stats...</p>
        ) : (
          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div className="card flex items-center gap-4" key={stat.label}>
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.color}`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-slate-900">{stat.value}</div>
                    <div className="text-xs text-slate-500">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent Orders</h2>
            <button className="btn-outline px-3.5 py-1.5 text-xs" onClick={() => navigate('/orders')}>
              View All
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <PackageOpen className="mx-auto mb-2" size={36} />
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-3 font-medium">Order ID</th>
                    <th className="pb-3 font-medium">{user.type === 'wholesaler' ? 'Shopkeeper' : 'Wholesaler'}</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate('/orders')}>
                      <td className="py-3 font-mono text-xs text-slate-500">#{String(order.id).padStart(6, '0')}</td>
                      <td className="py-3">{user.type === 'wholesaler' ? order.shopkeeperName : order.wholesalerName}</td>
                      <td className="py-3 font-semibold">₹{order.totalAmount}</td>
                      <td className="py-3">
                        <span className={`status-badge ${statusClass[order.status]}`}>{order.status}</span>
                      </td>
                      <td className="py-3 text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {user.type === 'shopkeeper' ? (
            <>
              <button className="btn-primary" onClick={() => navigate('/products')}>
                <ShoppingCart size={16} /> Browse Products
              </button>
              <button className="btn-outline" onClick={() => navigate('/chat')}>
                <MessageCircle size={16} /> Message Wholesaler
              </button>
            </>
          ) : (
            <>
              <button className="btn-primary" onClick={() => navigate('/products')}>
                <PlusCircle size={16} /> Add Product
              </button>
              <button className="btn-outline" onClick={() => navigate('/orders')}>
                <ClipboardList size={16} /> Manage Orders
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
