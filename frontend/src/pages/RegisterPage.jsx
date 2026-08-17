import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Store, Warehouse, AlertTriangle, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const FEATURES = [
  'Verified wholesaler catalogue',
  'Bulk-tier automatic pricing',
  'Real-time order & delivery tracking',
  'Instant in-app chat',
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    type: 'shopkeeper',
    name: '',
    businessName: '',
    email: '',
    mobile: '',
    address: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const setType = (type) => setFormData({ ...formData, type });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) return setError('Password must be at least 6 characters');

    setLoading(true);
    try {
      const res = await API.post('/auth/register', formData);
      login(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 px-6 py-10 sm:px-10 lg:px-16">
      <button
        onClick={() => navigate('/')}
        className="mb-10 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} /> Back to home
      </button>

      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2 lg:items-start">
        {/* Left — pitch */}
        <div>
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-harvest-600 text-white shadow-lg">
              <Leaf size={20} />
            </div>
            <div>
              <div className="font-display text-lg font-bold tracking-tight text-slate-900">GROCIFY</div>
              <div className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
                B2B GROCERY MARKETPLACE
              </div>
            </div>
          </div>

          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-slate-900">
            Set up your business account.
          </h1>
          <p className="mt-4 max-w-md text-slate-500">
            Two minutes and you're ready to trade — no credit card, no onboarding call.
          </p>

          <div className="mt-8 max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Included on every account
            </p>
            <ul className="space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-leaf-50 text-leaf-700">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right — floating form card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-card sm:p-8">
          {error && (
            <p className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">I am a</label>
              <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-leaf-50 p-1.5">
                <button
                  type="button"
                  onClick={() => setType('shopkeeper')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                    formData.type === 'shopkeeper' ? 'bg-white text-slate-900 shadow-sm' : 'text-leaf-500'
                  }`}
                >
                  <Store size={16} /> Shopkeeper (Buyer)
                </button>
                <button
                  type="button"
                  onClick={() => setType('wholesaler')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                    formData.type === 'wholesaler' ? 'bg-white text-slate-900 shadow-sm' : 'text-leaf-500'
                  }`}
                >
                  <Warehouse size={16} /> Wholesaler (Seller)
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  name="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="form-label">Business Name</label>
                <input
                  className="form-input"
                  name="businessName"
                  placeholder="Firm / Store name"
                  value={formData.businessName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                <label className="form-label">Mobile</label>
                <input
                  className="form-input"
                  name="mobile"
                  placeholder="+91"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Business Address</label>
              <textarea
                className="form-input resize-y"
                name="address"
                rows={2}
                placeholder="Shop no, street, city, PIN"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="form-label">Password (min 6)</label>
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
              {loading ? 'Creating account...' : 'Create Grocify account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login/shopkeeper" className="font-semibold text-harvest-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
