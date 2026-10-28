import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('athra_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    return Boolean(localStorage.getItem('athra_token'));
  });

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    const token = localStorage.getItem('athra_token');
    if (!token) {
      setUser(null);
      localStorage.removeItem('athra_user');
      setLoading(false);
      return;
    }

    try {
      const userData = await api.getMe();
      setUser(userData);
      localStorage.setItem('athra_user', JSON.stringify(userData));
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      localStorage.removeItem('athra_token');
      localStorage.removeItem('athra_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await api.login(username, password);
    if (response.access_token) {
      localStorage.setItem('athra_token', response.access_token);
      if (response.user) {
        localStorage.setItem('athra_user', JSON.stringify(response.user));
        setUser(response.user);
      } else {
        const u = await api.getMe();
        localStorage.setItem('athra_user', JSON.stringify(u));
        setUser(u);
      }
      setLoading(false);
      return response.user;
    }
    throw new Error('Login failed: Token not received');
  };

  const logout = () => {
    localStorage.removeItem('athra_token');
    localStorage.removeItem('athra_user');
    setUser(null);
    setLoading(false);
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
