import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuth';

/** Admin workspace is the normal team UI with edit controls — redirect here after login. */
function AdminDashboard() {
  const { isAdmin } = useAdminAuth();

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Navigate to="/team" replace />;
}

export default AdminDashboard;
