import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const statuses = ['processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const statusLabel = status => status.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
const money = value => `$${Number(value || 0).toFixed(2)}`;

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api.get(`/admin/orders/${id}`).then(response => { if (active) setOrder(response.data.order); })
      .catch(requestError => { if (active) setError(requestError.response?.data?.message || 'Order details could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const changeStatus = async status => {
    setSaving(true);
    try {
      const response = await api.put(`/orders/${id}/status`, { status });
      setOrder(response.data.order);
      toast.success('Order status updated.');
    } catch (requestError) { toast.error(requestError.response?.data?.message || 'Status could not be updated.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading-state"><span className="spinner" />Loading order...</div>;
  if (error || !order) return <div className="admin-page"><div className="notice notice-error" role="alert">{error || 'Order not found.'}</div><Link className="text-link" to="/admin/orders">Back to orders</Link></div>;
  const address = order.shippingAddress;
  return <div className="admin-page">
    <div className="admin-page-heading"><div><Link className="text-link" to="/admin/orders">← All orders</Link><span className="eyebrow admin-detail-eyebrow">ORDER MANAGEMENT</span><h1>Order #{order._id.slice(-8).toUpperCase()}</h1><p>Placed {new Date(order.createdAt).toLocaleString()}</p></div><label className="admin-order-status-control">Order status<select value={order.status} disabled={saving || order.status === 'cancelled'} onChange={event => changeStatus(event.target.value)}>{statuses.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>{order.status === 'cancelled' && <small>A cancelled order cannot be reopened.</small>}</label></div>
    <div className="admin-order-detail-grid">
      <section className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">PURCHASE</span><h2>Items</h2></div><span className={`admin-payment ${order.isPaid ? 'paid' : 'unpaid'}`}>{order.isPaid ? 'Paid' : 'Unpaid'}</span></div><div className="admin-order-detail-items">{order.items.map((item, index) => <article className="admin-order-detail-item" key={`${item.book?._id || index}-${index}`}><div><strong>{item.book?.title || 'Removed book'}</strong><small>{item.book?.author || ''}</small><small>Qty {item.quantity} · {money(item.price)} each</small></div><strong>{money(item.price * item.quantity)}</strong></article>)}</div><div className="admin-order-detail-total"><span>Total</span><strong>{money(order.totalPrice)}</strong></div><p className="admin-order-payment-method">Payment method: {order.paymentMethod === 'cash_on_delivery' ? 'Cash on delivery' : 'Stripe card'}</p></section>
      <section className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">CUSTOMER</span><h2>Customer details</h2></div></div><div className="admin-order-address"><strong>{order.user?.name || 'Deleted user'}</strong><a href={`mailto:${order.user?.email || ''}`}>{order.user?.email || 'No email available'}</a><hr /><span className="eyebrow">SHIP TO</span><address>{address.fullName}<br />{address.address}<br />{address.city}, {address.postalCode}<br />{address.country}</address></div></section>
    </div>
  </div>;
}
