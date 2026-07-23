import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Already logged in → go to dashboard
  if (user) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="auth-page">
      <div style={{ textAlign: 'center' }}>
        {/* Brand */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '60px', marginBottom: '10px' }}>🥦</div>
          <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#2563eb', letterSpacing: '4px' }}>
            GROCIFY
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px', marginTop: '8px' }}>
            B2B Grocery Platform — Connecting Shopkeepers & Wholesalers
          </p>
        </div>

        {/* Portal selection cards */}
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* Shopkeeper Portal */}
          <div
            className="card"
            style={{
              width: '280px',
              cursor: 'pointer',
              border: '2px solid transparent',
              transition: 'all 0.2s',
            }}
            onClick={() => navigate('/login/shopkeeper')}
            onMouseEnter={(e) => (e.currentTarget.style.border = '2px solid #2563eb')}
            onMouseLeave={(e) => (e.currentTarget.style.border = '2px solid transparent')}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Shopkeeper Portal
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
              Browse products from wholesalers, place bulk orders, and track deliveries.
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              Login as Shopkeeper →
            </button>
          </div>

          {/* Wholesaler Portal */}
          <div
            className="card"
            style={{
              width: '280px',
              cursor: 'pointer',
              border: '2px solid transparent',
              transition: 'all 0.2s',
            }}
            onClick={() => navigate('/login/wholesaler')}
            onMouseEnter={(e) => (e.currentTarget.style.border = '2px solid #2563eb')}
            onMouseLeave={(e) => (e.currentTarget.style.border = '2px solid transparent')}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏭</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Wholesaler Portal
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
              List your products, manage inventory, fulfill orders from shopkeepers.
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              Login as Wholesaler →
            </button>
          </div>
        </div>

        <p style={{ marginTop: '28px', color: '#64748b', fontSize: '14px' }}>
          New here?{' '}
          <span
            style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/register')}
          >
            Create an account
          </span>
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
