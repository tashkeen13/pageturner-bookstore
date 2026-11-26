import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import BookCover from '../components/BookCover';
import { Badge, Pagination } from '../components/ui';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/orders/my-orders', { params: { page, limit: 10 } })
      .then(response => {
        if (!active) return;
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
      })
      .catch(requestError => {
        if (active) setError(requestError.response?.data?.message || 'We could not load your orders. Please try again.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, retryCount]);

  const changePage = nextPage => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="page-shell">
      <div className="page-heading">
        <span className="eyebrow">YOUR PAGETURNER HISTORY</span>
        <h1>Orders.</h1>
        <p>A little record of the stories you've chosen.</p>
      </div>
      {loading ? <div className="loading-state"><span className="spinner" />Loading your orders...</div>
        : error ? <div className="notice notice-error" role="alert">{error} <button className="small-button" onClick={() => setRetryCount(count => count + 1)}>Try again</button></div>
          : orders.length ? <>
            <div className="order-list">
              {orders.map(order => <Link className="order-card" to={`/orders/${order._id}`} key={order._id} aria-label={`View order ${order._id.slice(-8).toUpperCase()}`}>
                <div><strong>Order {order._id.slice(-8).toUpperCase()}</strong><span>{new Date(order.createdAt).toLocaleDateString()}</span></div>
                <div className="order-history-covers" aria-label="Books in this order">{order.items.slice(0, 4).map((item, index) => item.book && <BookCover key={`${item.book._id}-${index}`} book={item.book} className="order-history-cover" />)}{order.items.length > 4 && <span>+{order.items.length - 4}</span>}</div>
                <p>{order.items.map(item => `${item.book?.title || 'Book'} x ${item.quantity}`).join(', ')}</p>
                {order.status === 'cancelled' ? <p className="order-list-cancelled">Cancelled</p> : <ol className="order-card-timeline" aria-label={`Order progress: ${order.status}`}>{['processing', 'shipped', 'delivered'].map((step, index) => <li key={step} className={['processing', 'shipped', 'delivered'].indexOf(order.status) >= index ? 'complete' : ''}><span />{step[0].toUpperCase() + step.slice(1)}</li>)}</ol>}
                <div><Badge tone={order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : order.status === 'processing' ? 'warning' : 'neutral'} className={`status-${order.status}`}>{order.status}</Badge><span className="payment-status">{order.isPaid ? 'Paid' : 'Payment pending'}</span><strong>${Number(order.totalPrice).toFixed(2)}</strong><span className="order-view-link">View details →</span></div>
              </Link>)}
            </div>
            <Pagination page={page} totalPages={pagination.totalPages} onChange={changePage} />
          </> : <div className="empty-state"><h2>No orders just yet.</h2><p>Your next favorite is somewhere on the shelves.</p><Link className="button button-dark" to="/books">Browse books</Link></div>}
    </main>
  );
}
