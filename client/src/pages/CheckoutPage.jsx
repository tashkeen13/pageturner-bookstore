import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../hooks/useCart';
import api from '../services/api';
import { CheckoutSteps } from '../components/ui';

const initialAddress = { fullName: '', address: '', city: '', postalCode: '', country: '' };

export default function CheckoutPage() {
  const { items } = useCart();
  const [address, setAddress] = useState(initialAddress);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [quote, setQuote] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [loadingQuote, setLoadingQuote] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingQuote(true);
    setError('');
    api.post('/orders/quote', { items: items.map(item => ({ book: item._id || item.id, quantity: item.quantity })) })
      .then(response => { if (active) setQuote(response.data); })
      .catch(requestError => { if (active) setError(requestError.response?.data?.message || 'We could not verify your bag and current prices.'); })
      .finally(() => { if (active) setLoadingQuote(false); });
    api.get('/users/profile').then(response => {
      if (!active) return;
      const saved = response.data.user.savedAddresses || [];
      setSavedAddresses(saved);
      if (saved.length) {
        setAddress({ fullName: saved[0].fullName, address: saved[0].address, city: saved[0].city, postalCode: saved[0].postalCode, country: saved[0].country });
        setSelectedAddress(saved[0]._id || '0');
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [items]);

  const chooseAddress = value => {
    setSelectedAddress(value);
    const saved = savedAddresses.find((item, index) => (item._id || String(index)) === value);
    if (saved) setAddress({ fullName: saved.fullName, address: saved.address, city: saved.city, postalCode: saved.postalCode, country: saved.country });
  };

  const changeAddress = (field, value) => {
    setSelectedAddress('');
    setAddress(current => ({ ...current, [field]: value }));
  };

  const submit = async event => {
    event.preventDefault();
    setError('');
    setBusy(true);
    const payload = { items: items.map(item => ({ book: item._id || item.id, quantity: item.quantity })), shippingAddress: address };
    try {
      if (paymentMethod === 'cod') {
        const { data } = await api.post('/orders/cod', payload);
        toast.success('Your cash on delivery order is placed.');
        navigate(`/order-confirmation?order_id=${data.order._id}`, { replace: true });
        return;
      }
      const response = await api.post('/orders/checkout-session', payload);
      if (!response.data.checkoutUrl) throw new Error('Stripe did not return a checkout link.');
      window.location.assign(response.data.checkoutUrl);
    } catch (requestError) {
      setError(requestError.response?.data?.details?.join(' ') || requestError.response?.data?.message || requestError.message || 'We could not start checkout. Please try again.');
      setBusy(false);
    }
  };

  if (!items.length) return <main className="page-shell"><div className="empty-state"><span className="eyebrow">CHECKOUT</span><h1>Your bag is empty.</h1><p>Add books to your bag before checking out.</p><Link className="button button-dark" to="/books">Browse books</Link></div></main>;

  const total = Number(quote?.totalPrice || 0);
  return <main className="page-shell">
    <div className="page-heading"><span className="eyebrow">SECURE CHECKOUT</span><h1>Almost yours.</h1><p>Enter your delivery details and choose how you want to pay.</p></div>
    <CheckoutSteps current={0} />
    {searchParams.get('canceled') && <div className="notice">Payment was canceled. Your bag is still saved here.</div>}
    <div className="cart-layout checkout-layout">
      <form className="checkout-form" onSubmit={submit}>
        <h2>Delivery address</h2>
        {savedAddresses.length > 0 && <label>Use a saved address<select value={selectedAddress} onChange={event => chooseAddress(event.target.value)}><option value="">Enter a different address</option>{savedAddresses.map((item, index) => <option value={item._id || String(index)} key={item._id || index}>{item.label || `Address ${index + 1}`} · {item.city}</option>)}</select></label>}
        <label>Full name<input name="fullName" autoComplete="name" minLength="2" maxLength="100" required value={address.fullName} onChange={event => changeAddress('fullName', event.target.value)} /></label>
        <label>Street address<input name="address" autoComplete="street-address" minLength="4" maxLength="200" required value={address.address} onChange={event => changeAddress('address', event.target.value)} /></label>
        <div className="form-row"><label>City<input name="city" autoComplete="address-level2" minLength="2" maxLength="100" required value={address.city} onChange={event => changeAddress('city', event.target.value)} /></label><label>Postal code<input name="postalCode" autoComplete="postal-code" minLength="2" maxLength="30" required value={address.postalCode} onChange={event => changeAddress('postalCode', event.target.value)} /></label></div>
        <label>Country<input name="country" autoComplete="country-name" minLength="2" maxLength="100" required value={address.country} onChange={event => changeAddress('country', event.target.value)} /></label>
        <fieldset className="payment-method-field"><legend>Payment method</legend><label><input type="radio" name="paymentMethod" value="stripe" checked={paymentMethod === 'stripe'} onChange={() => setPaymentMethod('stripe')} /> Card with Stripe (test mode)</label><label><input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} /> Cash on delivery</label></fieldset>
        {error && <p className="form-error" role="alert">{error}</p>}
        {paymentMethod === 'stripe' && <p className="muted">Stripe is in test mode. No real payment will be taken.</p>}
        <button className="button button-dark button-wide" disabled={busy || loadingQuote || !quote}>{busy ? (paymentMethod === 'cod' ? 'Placing order...' : 'Opening secure payment...') : paymentMethod === 'cod' ? 'Place cash on delivery order' : `Pay $${total.toFixed(2)} with Stripe`}</button>
      </form>
      <aside className="cart-summary"><h2>Your order</h2>
        {loadingQuote ? <div className="loading-state"><span className="spinner" />Checking current prices...</div> : <div className="checkout-items">{quote?.items?.map(item => <p key={item.book}><span>{item.title} × {item.quantity}</span><strong>${Number(item.itemTotal).toFixed(2)}</strong></p>)}</div>}
        <p><span>Subtotal</span><strong>${total.toFixed(2)}</strong></p><p><span>Shipping</span><span>Free</span></p><div><span>Total</span><strong>${total.toFixed(2)}</strong></div><p className="muted">Price and available stock are verified by the server.</p>
      </aside>
    </div>
  </main>;
}
