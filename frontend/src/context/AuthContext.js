import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const AuthContext = createContext(null);

// Provider component - wrap App with this
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // loading while we check localStorage

  // On app load, check if user info is saved in localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('grocifyUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Login: save user + token to state and localStorage
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('grocifyUser', JSON.stringify(userData));
  };

  // Logout: clear everything
  const logout = () => {
    setUser(null);
    localStorage.removeItem('grocifyUser');
  };

  // Update user info (for profile edits)
  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('grocifyUser', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook - use this in any component to access auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
