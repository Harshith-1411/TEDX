import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuth';
import { adminLogin } from '../services/api';
import './Admin.css';

function AdminLogin() {
  const navigate = useNavigate();
  const { isAdmin, login } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = 'Admin Login | TEDx BIET'; }, []);

  if (isAdmin) return <Navigate to="/team" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { token } = await adminLogin(username, password);
      login(token);
      navigate('/team');
    } catch (requestError) {
      setError(requestError.data?.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="glass-card admin-login-card reveal-element active">
        <div className="eyebrow-tag mono">Restricted access</div>
        <h1 className="admin-login-title">Admin <span style={{color:'var(--red)'}}>Login</span></h1>
        <p className="admin-login-desc">After signing in you will see the normal team pages with options to edit details and upload photos.</p>
        <form className="admin-form" onSubmit={handleSubmit} noValidate>
          <div className="admin-field">
            <label className="admin-label mono">Username</label>
            <input
              className="admin-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="admin-field">
            <label className="admin-label mono">Password</label>
            <div className="admin-password-wrap">
              <input
                className="admin-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="admin-pw-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '◉' : '◌'}
              </button>
            </div>
          </div>
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button className="btn btn-fill admin-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
