import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.type) {
      return setError('Please select an account type');
    }
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/register', formData);
      login(res.data); // Auto login after register
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-body">
          {/* Left: Form */}
          <div className="auth-left">
            <div style={{ marginBottom: '16px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#2563eb' }}>
                Welcome to Grocify
              </h1>
            </div>
            <h3>Create New Account</h3>

            {error && (
              <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px', background: '#fef2f2', padding: '10px 14px', borderRadius: '8px' }}>
                ⚠️ {error}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Register As</label>
                <select name="type" value={formData.type} onChange={handleChange} required>
                  <option value="" disabled>Select Account Type</option>
                  <option value="shopkeeper">Shopkeeper</option>
                  <option value="wholesaler">Wholesaler</option>
                </select>
              </div>

              <div className="form-group">
                <label>Full Name / Business Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="text"
                  name="mobile"
                  placeholder="Enter Mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Business Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Enter Address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create Password (min 6 chars)"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>

            <p className="register-text">
              Already have an account?{' '}
              <Link to="/login/shopkeeper">Login</Link>
            </p>
          </div>

          {/* Right: Illustration */}
          <div className="auth-right">
            <div className="placeholder-img">🥦</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
