import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../hooks/useCart';
import BookCover from '../components/BookCover';

export default function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const { clear } = useCart();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const orderId = searchParams.get('order_id');
    if (!sessionId && !orderId) {
      setError('We could not find an order or payment session.');
      setLoading(false);
      return;
    }

    let active = true;
    (orderId ? api.get(`/orders/${orderId}`) : api.post('/orders/confirm-checkout', { sessionId }))
      .then(response => {
        if (!active) return;
        setOrder(response.data.order);
        clear();
      })
      .catch(requestError => {
        if (active) setError(requestError.response?.data?.message || 'We could not confirm your payment. Please check My Orders before trying again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [searchParams, clear]);

  if (loading) return <main className="page-shell"><div className="loading-state"><span className="spinner" />Confirming your payment and saving your order…</div></main>;
  if (error) return <main className="page-shell"><div className="empty-state"><span className="eyebrow">ORDER STATUS</span><h1>We need to check that.</h1><p role="alert">{error}</p><Link className="button button-dark" to="/orders">Check my orders</Link></div></main>;

  return <main className="page-shell"><section className="confirmation-card">
    <span className="eyebrow">THANK YOU FOR YOUR ORDER</span>
    <h1>Your next chapter is on its way.</h1>
    <p>{order.paymentMethod === 'cash_on_delivery' ? 'Your order is confirmed. Pay the delivery driver when it arrives.' : 'Payment was confirmed and your order has been saved.'}</p>
    <div className="confirmation-number">Order <strong>#{order._id.slice(-8).toUpperCase()}</strong></div>
    <div className="confirmation-book-items">{order.items.map((item, index) => <div className="confirmation-book-item" key={`${item.book?._id || item.book}-${index}`}>{item.book && <BookCover book={item.book} className="order-history-cover" />}<span>{item.book?.title || 'Book'} × {item.quantity}</span><strong>${(item.price * item.quantity).toFixed(2)}</strong></div>)}</div>
    <p className="confirmation-total"><span>{order.isPaid ? 'Total paid' : 'Amount due on delivery'}</span><strong>${Number(order.totalPrice).toFixed(2)}</strong></p>
    <div className="confirmation-actions"><Link className="button button-dark" to="/orders">View my orders</Link><Link className="text-link" to="/books">Keep browsing</Link></div>
  </section></main>;
}
