import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Icons } from '../components/Icons';
import './AuthPage.css';

// ── Shared Layout Wrapper ──────────────────────────────────────────────────
function AuthShell({ children }) {
  return (
    <div className="auth-root">
      <div className="auth-orb auth-orb--1" />
      <div className="auth-orb auth-orb--2" />
      <div className="auth-orb auth-orb--3" />
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand__icon"><Icons.scales style={{ width: 22, height: 22, color: 'white' }} /></div>
          <div>
            <h1 className="auth-brand__title">Nyaay Saathi</h1>
            <p className="auth-brand__subtitle">न्याय साथी — Your Legal AI Companion</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Login Page ─────────────────────────────────────────────────────────────
export function LoginPage({ onGoRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h2 className="auth-heading">Welcome back</h2>
      <p className="auth-sub">Sign in to continue your legal consultations</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}
        <div className="auth-field">
          <label htmlFor="login-email">Email Address</label>
          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <button className="auth-btn" type="submit" disabled={loading}>
          {loading && <span className="auth-spinner" />}
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <p className="auth-link-row">
        Don't have an account?{' '}
        <button type="button" onClick={onGoRegister}>Create one</button>
      </p>
    </AuthShell>
  );
}

// ── Register Page ──────────────────────────────────────────────────────────
export function RegisterPage({ onGoLogin }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h2 className="auth-heading">Create your account</h2>
      <p className="auth-sub">Free access to AI-powered legal guidance</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}
        <div className="auth-field">
          <label htmlFor="reg-name">Full Name</label>
          <input
            id="reg-name"
            type="text"
            placeholder="Rajan Kumar"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </div>
        <div className="auth-field">
          <label htmlFor="reg-email">Email Address</label>
          <input
            id="reg-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <label htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            type="password"
            placeholder="Min 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div className="auth-field">
          <label htmlFor="reg-confirm">Confirm Password</label>
          <input
            id="reg-confirm"
            type="password"
            placeholder="Repeat your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <button className="auth-btn" type="submit" disabled={loading}>
          {loading && <span className="auth-spinner" />}
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
      <p className="auth-link-row">
        Already have an account?{' '}
        <button type="button" onClick={onGoLogin}>Sign in</button>
      </p>
    </AuthShell>
  );
}
