import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, DollarSign, ShoppingBag, Users } from 'lucide-react';
import api from '../services/api';
import BookCover from '../components/BookCover';

const currency = amount => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/admin/dashboard')
      .then(response => { if (active) setDashboard(response.data); })
      .catch(requestError => { if (active) setError(requestError.response?.data?.message || 'Dashboard could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retryCount]);

  if (loading) return <div className="loading-state"><span className="spinner" />Loading dashboard…</div>;
  if (error) return <div className="notice notice-error" role="alert">{error}<button className="admin-inline-retry" onClick={() => setRetryCount(count => count + 1)}>Try again</button></div>;

  const { stats, recentOrders, lowStockBooks, salesHistory = [] } = dashboard;
  const maxMonthlySales = Math.max(0, ...salesHistory.map(month => Number(month.sales) || 0));
  const metrics = [
    { label: 'Total sales', value: currency(stats.totalSales), icon: DollarSign },
    { label: 'Total orders', value: stats.totalOrders, icon: ShoppingBag },
    { label: 'Total users', value: stats.totalUsers, icon: Users },
    { label: 'Low-stock books', value: stats.lowStockCount, icon: BookOpen }
  ];

  return <div className="admin-page">
    <div className="admin-page-heading"><div><span className="eyebrow">STORE OVERVIEW</span><h1>Dashboard</h1><p>Your shop at a glance.</p></div><Link className="button button-dark" to="/admin/books">Add a book</Link></div>
    <div className="admin-metrics">{metrics.map(({ label, value, icon: Icon }) => <article className="admin-metric" key={label}><span className="admin-metric-icon"><Icon size={18} /></span><span>{label}</span><strong>{value}</strong></article>)}</div>
    <section className="admin-panel admin-sales-panel">
      <div className="admin-panel-heading"><div><span className="eyebrow">PAID ORDERS</span><h2>Sales over the last six months</h2></div><BarChart3 size={19} aria-hidden="true" /></div>
      {salesHistory.length ? <div className="admin-sales-chart" role="img" aria-label={`Monthly paid sales: ${salesHistory.map(item => `${item.label} ${currency(item.sales)}`).join(', ')}`}>
        <svg viewBox="0 0 660 230" preserveAspectRatio="none" aria-hidden="true"><title>Monthly paid sales</title>
          <line x1="35" y1="180" x2="640" y2="180" className="sales-axis" />
          {[0, 1, 2, 3].map(tick => <line key={tick} x1="35" y1={180 - tick * 45} x2="640" y2={180 - tick * 45} className="sales-gridline" />)}
          {salesHistory.map((month, index) => { const barHeight = maxMonthlySales > 0 ? Math.max(3, Number(month.sales) / maxMonthlySales * 128) : 3; const x = 72 + index * 96; return <g key={`${month.label}-${index}`}><title>{month.label}: {currency(month.sales)}</title><rect x={x} y={180 - barHeight} width="48" height={barHeight} rx="4" className="sales-bar" /><text x={x + 24} y="210" textAnchor="middle">{month.label}</text></g>; })}
        </svg>
        {maxMonthlySales === 0 && <p className="sales-chart-empty">Paid sales will appear here as orders come in.</p>}
      </div> : <p className="admin-empty">Sales history is not available yet.</p>}
    </section>
    <div className="admin-dashboard-grid">
      <section className="admin-panel">
        <div className="admin-panel-heading"><div><span className="eyebrow">LATEST ACTIVITY</span><h2>Recent orders</h2></div><Link to="/admin/orders">All orders →</Link></div>
        {recentOrders.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th>Total</th></tr></thead><tbody>{recentOrders.map(order => <tr key={order._id}><td>#{order._id.slice(-8).toUpperCase()}</td><td>{order.user?.name || 'Customer'}</td><td>{new Date(order.createdAt).toLocaleDateString()}</td><td><span className={`admin-status status-${order.status}`}>{order.status}</span></td><td>{currency(order.totalPrice)}</td></tr>)}</tbody></table></div> : <p className="admin-empty">No orders have been placed yet.</p>}
      </section>
      <section className="admin-panel">
        <div className="admin-panel-heading"><div><span className="eyebrow">INVENTORY CHECK</span><h2>Low stock</h2></div><span className="admin-count">At or below {stats.lowStockLimit}</span></div>
        {lowStockBooks.length ? <ul className="low-stock-list">{lowStockBooks.map(book => <li key={book._id}><BookCover book={book} className="admin-mini-cover" /><span><strong>{book.title}</strong><small>{book.author}</small></span><b className={book.stock === 0 ? 'stock-empty' : ''}>{book.stock} left</b></li>)}</ul> : <p className="admin-empty">Everything is stocked above the low-stock limit.</p>}
      </section>
    </div>
  </div>;
}
