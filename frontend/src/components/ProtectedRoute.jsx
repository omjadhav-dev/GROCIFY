import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wraps any page that needs the user to be logged in
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Wait until we've checked localStorage
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#64748b', fontSize: '16px' }}>Loading...</p>
      </div>
    );
  }

  // Not logged in → redirect to home (landing page)
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
