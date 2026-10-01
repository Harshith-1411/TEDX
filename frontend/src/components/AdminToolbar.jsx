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
          <Link to="/team" className="btn btn-ghost admin-toolbar-btn">
            View team
          </Link>
          <button
            type="button"
            className="btn btn-ghost admin-toolbar-btn"
            onClick={() => navigate('/?addFaculty=1#faculty')}
          >
            Add faculty
          </button>
          <button
            type="button"
            className="btn btn-primary admin-toolbar-btn"
            onClick={() => navigate('/team?add=1')}
          >
            Add member
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
