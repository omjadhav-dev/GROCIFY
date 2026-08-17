import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Leaf, Store, Warehouse, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const LoginPage = () => {
  const { type } = useParams(); // 'shopkeeper' or 'wholesaler'
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isWholesaler = type === 'wholesaler';

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { ...formData, type });
      login(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Left — navy hero */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-b from-leaf-900 via-leaf-900 to-harvest-900 px-14 py-16 text-white md:flex">
        <div>
          <div className="mb-16 flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-harvest-600 text-white shadow-lg">
              <Leaf size={22} />
            </div>
            <div>
              <div className="font-display text-xl font-bold tracking-tight">GROCIFY</div>
              <div className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
                B2B GROCERY MARKETPLACE
              </div>
            </div>
          </div>

          <p className="mb-4 text-xs font-medium uppercase tracking-widest text-slate-400">
            Signed by thousands of retailers
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
            Wholesale that shows up on time. Every time.
          </h1>
          <p className="mt-5 max-w-md text-slate-300">
            Skip the middlemen. Grocify links you directly with wholesalers, with transparent
            pricing and live order visibility from placement to delivery.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium uppercase tracking-widest text-slate-400">
          <span>Direct Pricing</span>
          <span>·</span>
          <span>Live Tracking</span>
          <span>·</span>
          <span>Instant Chat</span>
        </div>
      </div>

      {/* Right — cream form panel */}
      <div className="flex flex-col justify-center bg-cream-50 px-6 py-12 sm:px-14">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft size={16} /> Back to home
            </button>
            <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-leaf-700">
              {isWholesaler ? <Warehouse size={13} /> : <Store size={13} />}
              {isWholesaler ? 'Wholesaler / Seller' : 'Shopkeeper / Buyer'}
            </span>
          </div>

          <h2 className="font-display text-3xl font-semibold text-slate-900">Welcome back.</h2>
          <p className="mt-2 text-sm text-slate-500">Sign in to your Grocify account to continue.</p>

          <div className="mt-6 grid grid-cols-2 gap-1.5 rounded-xl bg-leaf-50 p-1.5">
            <Link
              to="/login/shopkeeper"
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                !isWholesaler ? 'bg-white text-slate-900 shadow-sm' : 'text-leaf-500'
              }`}
            >
              <Store size={16} /> Shopkeeper
            </Link>
            <Link
              to="/login/wholesaler"
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                isWholesaler ? 'bg-white text-slate-900 shadow-sm' : 'text-leaf-500'
              }`}
            >
              <Warehouse size={16} /> Wholesaler
            </Link>
          </div>

          {error && (
            <p className="mt-5 flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                name="email"
                placeholder="you@business.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button className="btn-primary w-full py-3" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            New to Grocify?{' '}
            <Link to="/register" className="font-semibold text-harvest-600 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
