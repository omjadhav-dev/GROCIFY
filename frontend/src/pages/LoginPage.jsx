import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/login', { ...formData, type });
      login(res.data); // Save to context + localStorage
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-card-header">
          <span style={{ fontSize: '32px' }}>🥦</span>
          <h1 className="brand-name">GROCIFY</h1>
        </div>

        <div className="auth-card-body">
          {/* Left: Form */}
          <div className="auth-left">
            <h3>{portalLabel}</h3>

            {error && (
              <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px', background: '#fef2f2', padding: '10px 14px', borderRadius: '8px' }}>
                ⚠️ {error}
              </p>
            )}

            <form onSubmit={handleSubmit}>
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
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>

            <p className="register-text">
              Don't have an account?{' '}
              <Link to="/register">Register</Link>
            </p>

            <p className="register-text">
              {isWholesaler ? 'Login as Shopkeeper?' : 'Login as Wholesaler?'}{' '}
              <Link to={`/login/${isWholesaler ? 'shopkeeper' : 'wholesaler'}`}>
                Click Here
              </Link>
            </p>
          </div>

          {/* Right: Illustration */}
          <div className="auth-right">
            <div className="placeholder-img">
              {isWholesaler ? '🏭' : '🏪'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
