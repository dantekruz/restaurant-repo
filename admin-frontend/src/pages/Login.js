import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // login | forgot | otp | reset
  const [form, setForm] = useState({ email: '', password: '', otp: '', newPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.post('/api/auth/login', { email: form.email, password: form.password });
      if (res.data.user.role !== 'admin') { setError('Admin access only'); setLoading(false); return; }
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('adminUser', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await axios.post('/api/auth/forgot-password', { email: form.email });
      setSuccess('OTP sent to your email');
      setMode('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending OTP');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await axios.post('/api/auth/verify-otp', { email: form.email, otp: form.otp });
      setMode('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    }
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await axios.post('/api/auth/reset-password', { email: form.email, otp: form.otp, newPassword: form.newPassword });
      setSuccess('Password reset! Please login.');
      setMode('login');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, background: '#6B21A8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 22, color: 'white' }}>⭐</div>
          <div className="login-title">
            {mode === 'login' && 'Admin Login'}
            {mode === 'forgot' && 'Forgot Password'}
            {mode === 'otp' && 'Enter OTP'}
            {mode === 'reset' && 'Reset Password'}
          </div>
          <div className="login-subtitle">Restaurant Management System</div>
        </div>

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" name="email" type="email" placeholder="admin@restaurant.com" value={form.email} onChange={update} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-field">
                <input className="form-input" name="password" type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={update} required />
                <button type="button" className="password-toggle" onClick={() => setShowPwd(!showPwd)}>{showPwd ? '🙈' : '👁️'}</button>
              </div>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button type="button" className="link-btn" onClick={() => { setMode('forgot'); setError(''); }}>Forgot Password?</button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot}>
            <div className="form-group">
              <label className="form-label">Registered Email</label>
              <input className="form-input" name="email" type="email" placeholder="your@email.com" value={form.email} onChange={update} required />
            </div>
            {error && <div className="error-msg">{error}</div>}
            {success && <div className="success-msg">{success}</div>}
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</button>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button type="button" className="link-btn" onClick={() => setMode('login')}>Back to Login</button>
            </div>
          </form>
        )}

        {mode === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label">Enter OTP sent to {form.email}</label>
              <input className="form-input" name="otp" type="text" placeholder="6-digit OTP" value={form.otp} onChange={update} required maxLength={6} style={{ letterSpacing: 8, textAlign: 'center', fontSize: 20 }} />
            </div>
            {error && <div className="error-msg">{error}</div>}
            {success && <div className="success-msg">{success}</div>}
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="password-field">
                <input className="form-input" name="newPassword" type={showPwd ? 'text' : 'password'} placeholder="New password" value={form.newPassword} onChange={update} required />
                <button type="button" className="password-toggle" onClick={() => setShowPwd(!showPwd)}>{showPwd ? '🙈' : '👁️'}</button>
              </div>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
