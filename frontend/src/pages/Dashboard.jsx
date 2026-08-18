import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle2,
  Wallet,
  ShoppingBag,
  Inbox,
  Truck,
  PackageOpen,
  ShoppingCart,
  MessageCircle,
  BarChart3,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const statusClass = {
  Pending: 'bg-amber-50 text-amber-600',
  Accepted: 'bg-sky-50 text-sky-600',
  Rejected: 'bg-red-50 text-red-600',
  Dispatched: 'bg-indigo-50 text-indigo-600',
  Delivered: 'bg-emerald-50 text-emerald-700',
};

const statusDotClass = {
  Pending: 'bg-amber-500',
  Accepted: 'bg-sky-500',
  Rejected: 'bg-red-500',
  Dispatched: 'bg-indigo-500',
  Delivered: 'bg-emerald-600',
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const isWholesaler = user.type === 'wholesaler';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const calls = [
          API.get('/orders/my'),
          isWholesaler
            ? API.get('/products/my')
            : API.get('/products'),
        ];

        if (isWholesaler) {
          calls.push(API.get('/analytics/wholesaler'));
        }

        const results = await Promise.all(calls);

        setOrders(results[0].data);
        setProducts(results[1].data);

        if (isWholesaler) {
          setAnalytics(results[2].data);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isWholesaler]);

  const countByStatus = (status) =>
    orders.filter((o) => o.status === status).length;

  const totalRevenue = orders
    .filter((o) => o.status === 'Delivered')
    .reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0
    );

  const shopkeeperStats = [
    {
      label: 'Total Orders',
      value: orders.length,
      icon: Package,
      color: 'text-[#D45B2F] bg-[#FFF1EB]',
    },
    {
      label: 'Pending Orders',
      value: countByStatus('Pending'),
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Delivered',
      value: countByStatus('Delivered'),
      icon: CheckCircle2,
      color: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Amount Spent',
      value: `₹${totalRevenue.toFixed(0)}`,
      icon: Wallet,
      color: 'text-violet-600 bg-violet-50',
    },
  ];

  const wholesalerStats = [
    {
      label: 'My Products',
      value: products.length,
      icon: ShoppingBag,
      color: 'text-[#D45B2F] bg-[#FFF1EB]',
    },
    {
      label: 'New Orders',
      value: countByStatus('Pending'),
      icon: Inbox,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Orders Dispatched',
      value: countByStatus('Dispatched'),
      icon: Truck,
      color: 'text-cyan-600 bg-cyan-50',
    },
    {
      label: 'Revenue Earned',
      value: `₹${totalRevenue.toFixed(0)}`,
      icon: Wallet,
      color: 'text-emerald-700 bg-emerald-50',
    },
  ];

  const stats = isWholesaler
    ? wholesalerStats
    : shopkeeperStats;

  const recentOrders = orders.slice(0, 5);

  const maxRevenue = analytics
    ? Math.max(
        1,
        ...analytics.salesByDay.map(
          (d) => d.revenue
        )
      )
    : 1;

  const maxQty =
    analytics && analytics.topProducts.length
      ? Math.max(
          ...analytics.topProducts.map(
            (p) => p.quantity
          )
        )
      : 1;

  const hasSales =
    analytics &&
    analytics.salesByDay.some(
      (d) => d.revenue > 0
    );

  return (
    <div className="flex min-h-screen bg-[#FDFCF9]">

      <Sidebar />

      <div className="flex-1 p-8">

        {/* PAGE HEADER */}
        <div className="mb-7">

          <h1 className="font-display text-2xl font-semibold text-[#111A2E]">
            Welcome back, {user.name}!
          </h1>

          <p className="text-sm text-[#64748B]">
            {isWholesaler
              ? 'Here is an overview of your business activity.'
              : 'Here is a summary of your orders and activity.'}
          </p>

        </div>

        {/* STAT CARDS */}
        {loading ? (
          <p className="text-[#94A3B8]">
            Loading stats...
          </p>
        ) : (
          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  className="card flex items-center gap-4 border border-slate-200 bg-white"
                  key={stat.label}
                >

                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.color}`}
                  >
                    <Icon size={22} />
                  </div>

                  <div>

                    <div className="text-xl font-bold text-[#111A2E]">
                      {stat.value}
                    </div>

                    <div className="text-xs text-[#64748B]">
                      {stat.label}
                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

        {/* WHOLESALER DASHBOARD */}
        {isWholesaler ? (
          !loading &&
          analytics && (
            <>

              {/* REVENUE + ORDER STATUS */}
              <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">

                {/* REVENUE */}
                <div className="card border border-slate-200 bg-white lg:col-span-2">

                  <h2 className="mb-5 text-base font-semibold text-[#111A2E]">
                    Revenue — last 14 days
                  </h2>

                  {!hasSales ? (
                    <div className="py-16 text-center text-[#94A3B8]">

                      <BarChart3
                        className="mx-auto mb-2"
                        size={30}
                      />

                      No delivered orders in this period yet

                    </div>
                  ) : (
                    <div className="flex h-44 items-end gap-2">

                      {analytics.salesByDay.map((d) => (

                        <div
                          key={d.date}
                          className="flex flex-1 flex-col items-center gap-1.5"
                        >

                          <div className="w-full text-center text-[10px] font-medium text-[#94A3B8]">
                            {d.revenue > 0
                              ? `₹${d.revenue.toFixed(0)}`
                              : ''}
                          </div>

                          <div
                            className="w-full rounded-t-md bg-[#D45B2F] transition-all"
                            style={{
                              height: `${Math.max(
                                4,
                                (d.revenue /
                                  maxRevenue) *
                                  130
                              )}px`,
                            }}
                            title={`₹${d.revenue.toFixed(
                              0
                            )} across ${
                              d.orders
                            } order(s)`}
                          />

                          <div className="text-[10px] text-[#94A3B8]">
                            {new Date(
                              d.date
                            ).toLocaleDateString(
                              'en-IN',
                              {
                                day: '2-digit',
                                month: 'short',
                              }
                            )}
                          </div>

                        </div>

                      ))}

                    </div>
                  )}

                </div>

                {/* ORDER STATUS */}
                <div className="card border border-slate-200 bg-white">

                  <h2 className="mb-5 text-base font-semibold text-[#111A2E]">
                    Order status
                  </h2>

                  {Object.keys(
                    analytics.statusCounts
                  ).length === 0 ? (

                    <p className="text-sm text-[#94A3B8]">
                      No orders yet
                    </p>

                  ) : (

                    <div className="space-y-3">

                      {Object.entries(
                        analytics.statusCounts
                      ).map(
                        ([status, count]) => (

                          <div
                            key={status}
                            className="flex items-center justify-between text-sm"
                          >

                            <span className="flex items-center gap-2 text-[#64748B]">

                              <span
                                className={`h-2 w-2 rounded-full ${
                                  statusDotClass[
                                    status
                                  ] ||
                                  'bg-slate-400'
                                }`}
                              />

                              {status}

                            </span>

                            <span className="font-semibold text-[#111A2E]">
                              {count}
                            </span>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </div>

              </div>

              {/* TOP SELLING PRODUCTS */}
              <div className="card border border-slate-200 bg-white">

                <h2 className="mb-5 text-base font-semibold text-[#111A2E]">
                  Top-selling products
                </h2>

                {analytics.topProducts.length ===
                0 ? (

                  <div className="py-10 text-center text-[#94A3B8]">

                    <Package
                      className="mx-auto mb-2"
                      size={28}
                    />

                    No product sales yet

                  </div>

                ) : (

                  <div className="space-y-4">

                    {analytics.topProducts.map(
                      (p) => (

                        <div
                          key={p.productId}
                        >

                          <div className="mb-1 flex items-center justify-between text-sm">

                            <span className="font-medium text-[#111A2E]">
                              {p.name}
                            </span>

                            <span className="text-[#64748B]">
                              {p.quantity} units · ₹
                              {p.revenue.toFixed(
                                0
                              )}
                            </span>

                          </div>

                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">

                            <div
                              className="h-full rounded-full bg-[#D45B2F]"
                              style={{
                                width: `${
                                  (p.quantity /
                                    maxQty) *
                                  100
                                }%`,
                              }}
                            />

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

            </>
          )

        ) : (

          /* SHOPKEEPER DASHBOARD */
          <div className="card border border-slate-200 bg-white">

            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-base font-semibold text-[#111A2E]">
                Recent Orders
              </h2>

              <button
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-[#64748B] transition hover:border-[#D45B2F] hover:text-[#D45B2F]"
                onClick={() =>
                  navigate('/orders')
                }
              >
                View All
              </button>

            </div>

            {recentOrders.length === 0 ? (

              <div className="py-12 text-center text-[#94A3B8]">

                <PackageOpen
                  className="mx-auto mb-2"
                  size={36}
                />

                <p>No orders yet</p>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full text-left text-sm">

                  <thead>

                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-[#94A3B8]">

                      <th className="pb-3 font-medium">
                        Order ID
                      </th>

                      <th className="pb-3 font-medium">
                        Wholesaler
                      </th>

                      <th className="pb-3 font-medium">
                        Amount
                      </th>

                      <th className="pb-3 font-medium">
                        Status
                      </th>

                      <th className="pb-3 font-medium">
                        Date
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-50">

                    {recentOrders.map(
                      (order) => (

                        <tr
                          key={order.id}
                          className="cursor-pointer transition hover:bg-[#FFF8F5]"
                          onClick={() =>
                            navigate(
                              '/orders'
                            )
                          }
                        >

                          <td className="py-3 font-mono text-xs text-[#64748B]">
                            #
                            {String(
                              order.id
                            ).padStart(
                              6,
                              '0'
                            )}
                          </td>

                          <td className="py-3 text-[#111A2E]">
                            {order.wholesalerName}
                          </td>

                          <td className="py-3 font-semibold text-[#111A2E]">
                            ₹
                            {
                              order.totalAmount
                            }
                          </td>

                          <td className="py-3">

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                statusClass[
                                  order.status
                                ]
                              }`}
                            >
                              {
                                order.status
                              }
                            </span>

                          </td>

                          <td className="py-3 text-xs text-[#64748B]">
                            {new Date(
                              order.createdAt
                            ).toLocaleDateString(
                              'en-IN'
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        )}

      </div>
    </div>
  );
};

export default Dashboard;