import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    type: '',
    name: '',
    email: '',
    mobile: '',
    address: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.type) return setError('Please select an account type');
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
    <div className="flex min-h-screen items-center justify-center bg-leaf-50 px-4 py-10">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="grid md:grid-cols-2">
          <div className="p-8">
            <div className="mb-1 flex items-center gap-2">
              <Leaf className="text-leaf-600" size={20} />
              <h1 className="font-display text-lg font-semibold text-leaf-700">Welcome to Grocify</h1>
            </div>
            <h3 className="mb-5 mt-3 text-lg font-semibold text-slate-900">Create New Account</h3>

            {error && (
              <p className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Register As</label>
                <select className="form-input" name="type" value={formData.type} onChange={handleChange} required>
                  <option value="" disabled>Select Account Type</option>
                  <option value="shopkeeper">Shopkeeper</option>
                  <option value="wholesaler">Wholesaler</option>
                </select>
              </div>

              <div>
                <label className="form-label">Full Name / Business Name</label>
                <input className="form-input" name="name" placeholder="Enter Name" value={formData.name} onChange={handleChange} required />
              </div>

              <div>
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" name="email" placeholder="Enter Email" value={formData.email} onChange={handleChange} required />
              </div>

              <div>
                <label className="form-label">Mobile Number</label>
                <input className="form-input" name="mobile" placeholder="Enter Mobile" value={formData.mobile} onChange={handleChange} required />
              </div>

              <div>
                <label className="form-label">Business Address</label>
                <input className="form-input" name="address" placeholder="Enter Address" value={formData.address} onChange={handleChange} required />
              </div>

              <div>
                <label className="form-label">Password</label>
                <input className="form-input" type="password" name="password" placeholder="Create Password (min 6 chars)" value={formData.password} onChange={handleChange} required />
              </div>

              <button className="btn-primary w-full" type="submit" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>

            <p className="mt-4 text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login/shopkeeper" className="font-semibold text-leaf-700 hover:underline">
                Login
              </Link>
            </p>
          </div>

          <div className="hidden items-center justify-center bg-leaf-600 p-8 md:flex">
            <Leaf className="text-white" size={90} strokeWidth={1.25} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
