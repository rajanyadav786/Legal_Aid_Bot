import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE = 'http://localhost:8000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('nyaay_token'));
  const [loading, setLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Invalid token');
        return r.json();
      })
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem('nyaay_token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    localStorage.setItem('nyaay_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Registration failed');
    localStorage.setItem('nyaay_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('nyaay_token');
    setToken(null);
    setUser(null);
  }, []);

  const authFetch = useCallback(
    (url, options = {}) => {
      return fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
    },
    [token]
  );

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, authFetch, isAdmin: user?.is_admin === true }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export { API_BASE };
