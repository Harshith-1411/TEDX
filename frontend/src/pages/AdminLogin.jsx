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

  useEffect(() => {
    document.title = 'Admin login | TEDx BIET';
  }, []);

  if (isAdmin) {
    return <Navigate to="/team" replace />;
  }

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
    <section className="section admin-page">
      <div className="container admin-narrow">
        <span className="section-label">Restricted access</span>
        <h1 className="admin-title">Admin login</h1>
        <p className="admin-lede">
          After signing in you will see the normal team pages with options to edit details and
          upload photos.
        </p>
        <form className="admin-form admin-login-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <span className="admin-password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '◉' : '◌'}
              </button>
            </span>
          </label>
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default AdminLogin;
