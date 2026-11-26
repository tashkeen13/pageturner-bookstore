import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminRoute() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <main className="admin-access-denied"><div className="admin-access-card"><span className="eyebrow">ADMIN WORKSPACE</span><h1>Admin access required</h1><p>This area is reserved for administrator accounts. Registering creates a customer account; an administrator must grant the admin role in the users collection before you can manage the store.</p><div><Link className="button button-dark" to="/books">Browse the shop</Link><Link className="text-link" to="/profile">Your account</Link></div></div></main>;
  }
  return <Outlet />;
}
