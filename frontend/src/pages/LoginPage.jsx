import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Leaf, Store, Warehouse, AlertTriangle } from 'lucide-react';
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
  const portalLabel = isWholesaler ? "Wholesaler's Portal" : "Shopkeeper's Portal";

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
    <div className="flex min-h-screen items-center justify-center bg-leaf-50 px-4 py-10">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="flex items-center justify-center gap-2 border-b border-slate-100 py-5">
          <Leaf className="text-leaf-600" size={22} />
          <h1 className="font-display text-xl font-semibold text-leaf-700">GROCIFY</h1>
        </div>

        <div className="grid md:grid-cols-2">
          <div className="p-8">
            <h3 className="mb-5 text-lg font-semibold text-slate-900">{portalLabel}</h3>

            {error && (
              <p className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  name="email"
                  placeholder="Enter Email"
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
                  placeholder="Enter Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button className="btn-primary w-full" type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>

            <p className="mt-4 text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-leaf-700 hover:underline">
                Register
              </Link>
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {isWholesaler ? 'Login as Shopkeeper?' : 'Login as Wholesaler?'}{' '}
              <Link to={`/login/${isWholesaler ? 'shopkeeper' : 'wholesaler'}`} className="font-semibold text-leaf-700 hover:underline">
                Click Here
              </Link>
            </p>
          </div>

          <div className="hidden items-center justify-center bg-leaf-600 p-8 md:flex">
            {isWholesaler ? <Warehouse className="text-white" size={90} strokeWidth={1.25} /> : <Store className="text-white" size={90} strokeWidth={1.25} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
