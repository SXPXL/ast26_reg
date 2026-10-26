import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    const token = localStorage.getItem('athra_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      localStorage.removeItem('athra_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await api.login(username, password);
    if (response.access_token) {
      localStorage.setItem('athra_token', response.access_token);
      setUser(response.user);
      return response.user;
    }
    throw new Error('Login failed: Token not received');
  };

  const logout = () => {
    localStorage.removeItem('athra_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
