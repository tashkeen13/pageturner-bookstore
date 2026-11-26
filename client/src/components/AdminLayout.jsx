import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowLeft, BookOpen, LayoutDashboard, Mail, MessageSquareText, ShoppingCart, Store, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const links = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/books', label: 'Books', icon: BookOpen },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquareText },
  { to: '/admin/messages', label: 'Messages', icon: Mail }
];

export default function AdminLayout() {
  const { user } = useAuth();
  return <main className="admin-shell">
    <aside className="admin-sidebar">
      <Link className="admin-brand" to="/" aria-label="PageTurner storefront"><span className="brand-mark">P</span><span>PageTurner<small>ADMIN WORKSPACE</small></span></Link>
      <div className="admin-sidebar-heading"><span className="eyebrow">YOUR STORE</span><strong>Manage PageTurner</strong><small>Books, orders and stock in one place.</small></div>
      <nav aria-label="Admin navigation">
        {links.map(({ to, end, label, icon: Icon }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
          <Icon size={17} aria-hidden="true" />{label}
        </NavLink>)}
      </nav>
      <Link className="admin-back-link" to="/books"><ArrowLeft size={15} /> Back to storefront</Link>
    </aside>
    <section className="admin-content">
      <header className="admin-topbar"><div><span className="eyebrow">PAGETURNER CONTROL ROOM</span><strong>Store administration</strong></div><div className="admin-topbar-actions"><span className="admin-topbar-user">{user?.name || 'Administrator'}<small>Administrator</small></span><Link className="admin-storefront-link" to="/"><Store size={16} />Storefront</Link></div></header>
      <Outlet />
    </section>
  </main>;
}
