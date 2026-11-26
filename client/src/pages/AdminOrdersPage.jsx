import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Link } from 'react-router-dom';

const statuses = ['processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const statusLabel = status => status.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalOrders: 0 });
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/orders', { params: { page, limit: 20 } });
      setOrders(response.data.orders);
      setPagination(response.data.pagination);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Orders could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadOrders(); }, [loadOrders, retryCount]);

  const updateStatus = async (orderId, status) => {
    const previous = orders.find(order => order._id === orderId)?.status;
    setUpdating(orderId);
    try {
      const response = await api.put(`/orders/${orderId}/status`, { status });
      setOrders(current => current.map(order => order._id === orderId ? response.data.order : order));
      toast.success('Order status updated.');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Order status could not be updated.');
      if (previous) setOrders(current => current.map(order => order._id === orderId ? { ...order, status: previous } : order));
    } finally {
      setUpdating('');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div><span className="eyebrow">FULFILLMENT</span><h1>Manage orders</h1><p>Review purchases and keep fulfillment status current.</p></div>
        <button className="button button-light" onClick={loadOrders} disabled={loading}>Refresh</button>
      </div>
      {error && <div className="notice notice-error" role="alert">{error} <button className="admin-inline-retry" onClick={() => setRetryCount(count => count + 1)}>Try again</button></div>}
      {loading ? <div className="loading-state"><span className="spinner" />Loading orders...</div>
        : <section className="admin-panel">
          <div className="admin-table-wrap">
            <table className="admin-table admin-orders-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>{orders.map(order => <tr key={order._id}>
                <td><Link className="admin-order-detail-link" to={`/admin/orders/${order._id}`}>#{order._id.slice(-8).toUpperCase()} · Details</Link></td>
                <td>{order.user?.name || 'Unknown'}<small className="admin-cell-subtext">{order.user?.email || ''}</small></td>
                <td>{order.items.map((item, index) => <span className="admin-order-item" key={`${item.book?._id || 'missing'}-${index}`}>{item.book?.title || 'Removed book'} x {item.quantity}</span>)}</td>
                <td><span className={`admin-payment ${order.isPaid ? 'paid' : 'unpaid'}`}>{order.isPaid ? 'Paid' : 'Unpaid'}</span></td>
                <td>${Number(order.totalPrice).toFixed(2)}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td><select aria-label={`Update status for order ${order._id}`} value={order.status} disabled={updating === order._id} onChange={event => updateStatus(order._id, event.target.value)}>{statuses.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></td>
              </tr>)}</tbody>
            </table>
            {!orders.length && !error && <p className="admin-empty">No orders yet.</p>}
          </div>
          {pagination.totalPages > 1 && <div className="admin-pagination">
            <span>{pagination.totalOrders} orders · Page {page} of {pagination.totalPages}</span>
            <div>
              <button className="button button-light" disabled={loading || page <= 1} onClick={() => setPage(current => current - 1)}>Previous</button>
              <button className="button button-light" disabled={loading || page >= pagination.totalPages} onClick={() => setPage(current => current + 1)}>Next</button>
            </div>
          </div>}
        </section>}
    </div>
  );
}
