import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuth';
import './AdminToolbar.css';

function AdminToolbar({ statusMessage = '' }) {
  const navigate = useNavigate();
  const { isAdmin, logout } = useAdminAuth();

  if (!isAdmin) return null;

  return (
    <div className="admin-toolbar" role="region" aria-label="Admin tools">
      <div className="container admin-toolbar-inner">
        <p className="admin-toolbar-label">
          Admin mode
          {statusMessage ? <span className="admin-toolbar-status"> · {statusMessage}</span> : null}
        </p>
        <div className="admin-toolbar-actions">
          <button
            type="button"
            className="btn btn-ghost admin-toolbar-btn"
            onClick={() => {
              if (window.location.pathname !== '/') {
                navigate('/');
                setTimeout(() => {
                  document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' });
                }, 150);
              } else {
                document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            Team section
          </button>
          <button
            type="button"
            className="btn btn-primary admin-toolbar-btn"
            onClick={() => {
              if (window.location.pathname !== '/') {
                navigate('/');
                setTimeout(() => {
                  document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' });
                  window.dispatchEvent(new CustomEvent('admin-add-member'));
                }, 200);
              } else {
                document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' });
                window.dispatchEvent(new CustomEvent('admin-add-member'));
              }
            }}
          >
            + Add member
          </button>
          <button type="button" className="btn btn-ghost admin-toolbar-btn" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminToolbar;
