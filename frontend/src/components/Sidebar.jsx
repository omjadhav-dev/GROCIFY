import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get first letter of name for avatar
  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'G';

  // Nav items differ by user role
  const shopkeeperLinks = [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/products', icon: '🛒', label: 'Browse Products' },
    { to: '/orders', icon: '📦', label: 'My Orders' },
    { to: '/chat', icon: '💬', label: 'Messages' },
    { to: '/profile', icon: '👤', label: 'Profile' },
  ];

  const wholesalerLinks = [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/products', icon: '📦', label: 'My Products' },
    { to: '/orders', icon: '📋', label: 'Incoming Orders' },
    { to: '/chat', icon: '💬', label: 'Messages' },
    { to: '/profile', icon: '👤', label: 'Profile' },
  ];

  const links = user?.type === 'wholesaler' ? wholesalerLinks : shopkeeperLinks;

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <span className="logo-icon">🥦</span>
        <span className="brand-text">GROCIFY</span>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{avatarLetter}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.type}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
