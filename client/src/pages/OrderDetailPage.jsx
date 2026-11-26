import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import BookCover from '../components/BookCover';
import { Clock3, House, PackageCheck, Truck } from 'lucide-react';

const statusSteps = [
  { key: 'processing', label: 'Order in progress', icon: Clock3 },
  { key: 'shipped', label: 'Shipped', icon: PackageCheck },
  { key: 'out_for_delivery', label: 'Out for delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: House }
];
const money = value => `$${Number(value || 0).toFixed(2)}`;
const statusLabel = status => status.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setOrder(null);
    api.get(`/orders/${id}`)
      .then(response => { if (active) setOrder(response.data.order); })
      .catch(requestError => {
        if (active) setError(requestError.response?.status === 404
          ? 'We could not find that order in your account.'
          : requestError.response?.data?.message || 'Order details could not be loaded.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const cancelOrder = async () => {
    if (!window.confirm('Cancel this order? Its book quantities will be returned to stock.')) return;
    setBusy(true);
    setError('');
    try {
      const response = await api.post(`/orders/${id}/cancel`);
      setOrder(response.data.order);
      toast.success('Order cancelled. Inventory has been restored.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'This order could not be cancelled.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <main className="page-shell"><div className="loading-state"><span className="spinner" />Loading order details…</div></main>;
  if (error && !order) return <main className="page-shell"><div className="empty-state"><span className="eyebrow">YOUR ORDERS</span><h1>Order unavailable.</h1><p role="alert">{error}</p><Link className="button button-dark" to="/orders">Back to my orders</Link></div></main>;

  const progressIndex = order.status === 'delivered' ? statusSteps.length - 1 : statusSteps.findIndex(step => step.key === order.status);
  return <main className="page-shell order-detail-page">
    <Link className="text-link" to="/orders">← Back to my orders</Link>
    <div className="page-heading order-detail-heading">
      <span className="eyebrow">ORDER {order._id.slice(-8).toUpperCase()}</span>
      <h1>Order details.</h1>
      <p>Placed {new Date(order.createdAt).toLocaleDateString()} · <span className={`admin-status status-${order.status}`}>{order.status}</span></p>
    </div>

    {error && <div className="notice notice-error" role="alert">{error}</div>}

    <section className="order-timeline-card" aria-label="Order status timeline">
      <h2>Delivery progress</h2>
      {order.status === 'cancelled' ? <div className="cancelled-timeline"><span className="status-pill status-cancelled">Cancelled</span><p>This order was cancelled and its book quantities were returned to stock.</p></div>
        : <ol className="order-timeline">{statusSteps.map((step, index) => {
          const Icon = step.icon;
          const complete = progressIndex >= index;
          const current = order.status === step.key;
          return <li className={`${complete ? 'complete' : ''}${current ? ' current' : ''}`} key={step.key} aria-current={current ? 'step' : undefined}>
            <span className="timeline-marker"><Icon size={19} strokeWidth={1.9} aria-hidden="true" /></span>
            <span><strong>{step.label}</strong><small>{current ? 'Current status' : complete ? 'Complete' : 'Waiting'}</small></span>
          </li>;
        })}</ol>}
      {order.status === 'processing' && <button className="button button-light cancel-order-button" type="button" onClick={cancelOrder} disabled={busy}>{busy ? 'Cancelling…' : 'Cancel order'}</button>}
    </section>

    <div className="order-detail-grid">
      <section className="admin-panel order-detail-panel">
        <div className="admin-panel-heading"><div><span className="eyebrow">YOUR PURCHASE</span><h2>Items</h2><p className="muted">{order.paymentMethod === 'cash_on_delivery' ? 'Cash on delivery' : 'Stripe card payment'}</p></div><span className={`admin-payment ${order.isPaid ? 'paid' : 'unpaid'}`}>{order.isPaid ? 'Paid' : 'Payment pending'}</span></div>
        <div className="order-detail-items">{order.items.map((item, index) => <article className="order-detail-item" key={`${item.book?._id || item.book}-${index}`}>
          {item.book && <BookCover book={item.book} className="order-history-cover" />}
          <div><strong>{item.book?.title || 'Book no longer available'}</strong>{item.book?.author && <small>by {item.book.author}</small>}<small>Quantity: {item.quantity} · {money(item.price)} each</small></div>
          <strong>{money(item.price * item.quantity)}</strong>
        </article>)}</div>
        <div className="order-detail-total"><span>Order total</span><strong>{money(order.totalPrice)}</strong></div>
      </section>

      <section className="admin-panel order-shipping-panel">
        <div className="admin-panel-heading"><div><span className="eyebrow">DELIVERY</span><h2>Shipping address</h2></div></div>
        <address>{order.shippingAddress.fullName}<br />{order.shippingAddress.address}<br />{order.shippingAddress.city}, {order.shippingAddress.postalCode}<br />{order.shippingAddress.country}</address>
      </section>
    </div>
  </main>;
}
