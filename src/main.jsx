import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDown, ArrowRight, Check, ChevronDown, Heart, Instagram, Menu,
  Minus, Plus, Search, ShieldCheck, ShoppingBag, Sparkles, Truck, X
} from 'lucide-react';
import './style.css';

const productsSeed = [
  { id: 1, name: 'The Everyday Tote', category: 'Accessories', price: 89, color: 'Warm sand', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85', tag: 'Bestseller' },
  { id: 2, name: 'Cloud Cotton Shirt', category: 'Clothing', price: 64, color: 'Soft ivory', image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=85', tag: 'Just in' },
  { id: 3, name: 'Form Runner', category: 'Footwear', price: 118, color: 'Chalk / clay', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85', tag: 'Bestseller' },
  { id: 4, name: 'Minimal Timepiece', category: 'Accessories', price: 149, color: 'Brushed silver', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85', tag: 'Limited' },
  { id: 5, name: 'Relaxed Denim', category: 'Clothing', price: 98, color: 'Vintage indigo', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=85', tag: 'Just in' },
  { id: 6, name: 'Studio Headphones', category: 'Accessories', price: 179, color: 'Soft black', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85', tag: 'Bestseller' },
  { id: 7, name: 'Weekend Carryall', category: 'Accessories', price: 128, color: 'Olive canvas', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', tag: 'Just in' },
  { id: 8, name: 'Linen Summer Set', category: 'Clothing', price: 112, color: 'Natural linen', image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=900&q=85', tag: 'Limited' },
  { id: 9, name: 'Daybreak Sunglasses', category: 'Accessories', price: 76, color: 'Tortoise', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85', tag: 'Just in' },
  { id: 10, name: 'Form Leather Slide', category: 'Footwear', price: 104, color: 'Espresso', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85', tag: 'Bestseller' },
  { id: 11, name: 'Everyday Knit', category: 'Clothing', price: 86, color: 'Oatmeal', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=85', tag: 'Just in' },
  { id: 12, name: 'Sculpted Cuff', category: 'Accessories', price: 58, color: 'Polished gold', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85', tag: 'Limited' }
];

const categoryTiles = [
  { label: 'Clothing', detail: 'Easy layers, better days', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85' },
  { label: 'Accessories', detail: 'The finishing touches', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=85' },
  { label: 'Footwear', detail: 'Made to go further', image: 'https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=1000&q=85' }
];

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

function App() {
  const [products, setProducts] = useState(productsSeed);
  const [category, setCategory] = useState('All pieces');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Featured');
  const [cart, setCart] = useState(() => readStorage('velora-cart', []));
  const [favorites, setFavorites] = useState(() => readStorage('velora-favorites', []));
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderDone, setOrderDone] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');
  const [newsletterBusy, setNewsletterBusy] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then(response => { if (!response.ok) throw new Error('Product service unavailable'); return response.json(); })
      .then(data => { if (data.length) setProducts(data.map(product => ({ ...product, tag: productsSeed.find(item => item.id === product.id)?.tag || 'Just in' }))); })
      .catch(error => console.error('Unable to load products:', error));
  }, []);

  useEffect(() => localStorage.setItem('velora-cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('velora-favorites', JSON.stringify(favorites)), [favorites]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(() => {
    const result = products.filter(product =>
      (category === 'All pieces' || product.category === category) &&
      `${product.name} ${product.color}`.toLowerCase().includes(search.trim().toLowerCase())
    );
    if (sort === 'Price: low to high') result.sort((a, b) => a.price - b.price);
    if (sort === 'Price: high to low') result.sort((a, b) => b.price - a.price);
    if (sort === 'Name: A to Z') result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, category, search, sort]);
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const chooseCategory = value => {
    setCategory(value);
    setMenuOpen(false);
    document.querySelector('#shop')?.scrollIntoView({ behavior: 'smooth' });
  };
  const addToCart = product => {
    setCart(items => {
      const current = items.find(item => item.id === product.id);
      return current
        ? items.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...items, { ...product, quantity: 1 }];
    });
    setToast(`${product.name} added to your bag`);
  };
  const changeQty = (id, delta) => setCart(items =>
    items.map(item => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
      .filter(item => item.quantity > 0)
  );
  const toggleFavorite = product => {
    setFavorites(items => items.includes(product.id)
      ? items.filter(id => id !== product.id)
      : [...items, product.id]);
  };

  const submitOrder = async event => {
    event.preventDefault();
    setCheckoutError('');
    const customer = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer, items: cart.map(({ id, quantity }) => ({ id, quantity })) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'We could not place your order. Please try again.');
      setOrderDone(String(result.id));
      setCart([]);
    } catch (error) {
      setCheckoutError(error.message || 'We could not place your order. Please try again.');
    }
  };

  const submitNewsletter = async event => {
    event.preventDefault();
    setNewsletterBusy(true);
    setNewsletterError('');
    const email = new FormData(event.currentTarget).get('email');
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not join the list. Please try again.');
      setSubscribed(true);
    } catch (error) {
      setNewsletterError(error.message || 'Could not join the list. Please try again.');
    } finally {
      setNewsletterBusy(false);
    }
  };

  return (
    <>
      <div className="announcement"><Sparkles size={14} /><span>Good things take time. Free shipping on orders over $100.</span><button onClick={() => document.querySelector('#shop')?.scrollIntoView({ behavior: 'smooth' })}>Explore <ArrowRight size={13} /></button></div>
      <header className="site-header">
        <button className="icon-button menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>{menuOpen ? <X /> : <Menu />}</button>
        <button className="brand" onClick={() => { setCategory('All pieces'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>VELORA<span>STUDIO</span></button>
        <nav className={menuOpen ? 'open' : ''} aria-label="Main navigation">
          {['New arrivals', 'Clothing', 'Accessories', 'Footwear', 'Our story'].map(label =>
            <button key={label} onClick={() => label === 'Our story' ? document.querySelector('#story')?.scrollIntoView({ behavior: 'smooth' }) : chooseCategory(label === 'New arrivals' ? 'All pieces' : label)}>{label}</button>
          )}
        </nav>
        <div className="header-actions">
          <label className="search"><Search size={17} /><input value={search} onChange={event => { setSearch(event.target.value); document.querySelector('#shop')?.scrollIntoView({ behavior: 'smooth' }); }} placeholder="Search pieces" aria-label="Search products" /></label>
          <button className="icon-button bag" onClick={() => setCartOpen(true)} aria-label={`Shopping bag, ${itemCount} items`}><ShoppingBag /><span>{itemCount}</span></button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow"><span /> THE EVERYDAY, CONSIDERED</p>
            <h1>Less, but<br /><em>so much better.</em></h1>
            <p className="intro">A thoughtful edit of lasting pieces for the way you really live. Designed with intention. Made to stay.</p>
            <button className="primary" onClick={() => chooseCategory('All pieces')}>Shop the collection <ArrowRight size={17} /></button>
            <div className="hero-note"><span>01 / 03</span><i /><span>Made for your everyday</span></div>
          </div>
          <div className="hero-image">
            <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=90" alt="A carefully styled collection of timeless wardrobe pieces" />
            <div className="image-caption"><span>THE SPRING / SUMMER EDIT</span><strong>In good company.</strong></div>
            <button className="hero-next" onClick={() => chooseCategory('Clothing')} aria-label="Shop clothing"><ArrowDown /></button>
          </div>
        </section>

        <section className="promise-strip" aria-label="Shopping benefits">
          <div><Truck /><span><strong>Complimentary shipping</strong><small>On orders over $100</small></span></div>
          <div><ShieldCheck /><span><strong>Thoughtfully made</strong><small>Considered, quality materials</small></span></div>
          <div><Heart /><span><strong>Here for the long run</strong><small>Pieces you will keep reaching for</small></span></div>
        </section>

        <section className="category-section">
          <div className="section-heading"><div><p className="eyebrow">A GOOD PLACE TO START</p><h2>Find your kind of everyday.</h2></div><p>Considered pieces, just for you.</p></div>
          <div className="category-grid">{categoryTiles.map((tile, index) =>
            <button className={`category-tile tile-${index + 1}`} key={tile.label} onClick={() => chooseCategory(tile.label)}>
              <img src={tile.image} alt="" /><span className="tile-shade" /><span className="tile-copy"><small>{tile.detail}</small><strong>{tile.label}</strong></span><span className="tile-arrow"><ArrowRight /></span>
            </button>
          )}</div>
        </section>

        <section className="collection" id="shop">
          <div className="section-heading collection-heading"><div><p className="eyebrow">THE GOOD STUFF</p><h2>{category === 'All pieces' ? 'Pieces to live in.' : category + ', thoughtfully.'}</h2></div><p>{filtered.length} considered pieces</p></div>
          <div className="shop-tools">
            <div className="filter-chips">{['All pieces', 'Clothing', 'Accessories', 'Footwear'].map(value =>
              <button key={value} className={category === value ? 'selected' : ''} onClick={() => setCategory(value)}>{value}</button>
            )}</div>
            <label className="sort-control"><span>Sort by</span><select value={sort} onChange={event => setSort(event.target.value)}><option>Featured</option><option>Price: low to high</option><option>Price: high to low</option><option>Name: A to Z</option></select><ChevronDown size={14} /></label>
          </div>
          {filtered.length ? <div className="product-grid">{filtered.map(product =>
            <article className="product-card" key={product.id}>
              <div className="product-image">
                <img src={product.image} alt={product.name} loading="lazy" />
                <span className="product-tag">{product.tag}</span>
                <button className={`favorite ${favorites.includes(product.id) ? 'is-favorite' : ''}`} onClick={() => toggleFavorite(product)} aria-label={favorites.includes(product.id) ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}><Heart fill={favorites.includes(product.id) ? 'currentColor' : 'none'} /></button>
                <button className="add-button" onClick={() => addToCart(product)}>Add to bag <Plus size={16} /></button>
              </div>
              <div className="product-info"><div><h3>{product.name}</h3><p>{product.color}</p></div><strong>${product.price}</strong></div>
            </article>
          )}</div> : <div className="empty-search"><Search /><h3>Nothing found just yet.</h3><p>Try a different search or browse the full collection.</p><button className="text-link" onClick={() => { setSearch(''); setCategory('All pieces'); }}>View all pieces <ArrowRight size={15} /></button></div>}
          <button className="outline-button" onClick={() => { setCategory('All pieces'); setSearch(''); }}>Explore all pieces <ArrowRight size={16} /></button>
        </section>

        <section className="story-section" id="story">
          <div className="story-photo"><img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85" alt="Natural materials in a bright, considered studio" /></div>
          <div className="story-copy"><p className="eyebrow">A LITTLE LESS, A LOT MORE</p><h2>Keep what<br />feels like <em>you.</em></h2><p>We believe a good wardrobe is not about having more. It is about finding the pieces that make getting dressed feel easy, and keep feeling right long after the first wear.</p><button className="text-link" onClick={() => setToast('Our story is coming soon.')}>A note from our studio <ArrowRight size={16} /></button><span className="story-stamp">V<br />S</span></div>
        </section>

        <section className="quote-section"><p className="eyebrow">KIND WORDS, KEPT SIMPLE</p><div className="quote-mark">“</div><blockquote>These are the pieces I reach for without thinking. That is exactly the point.</blockquote><p className="quote-credit">JAMIE R. &nbsp;·&nbsp; VELORA CUSTOMER</p><div className="quote-dots"><span /><span /><span /></div></section>

        <section className="newsletter">
          <div><p className="eyebrow">A LETTER, NOT MORE NOISE</p><h2>A little good<br /><em>in your inbox.</em></h2><p>New pieces, thoughtful notes, and the occasional reason to look forward to Monday.</p></div>
          {subscribed ? <div className="newsletter-success"><Check /><strong>You're on the list.</strong><span>Look out for a little note from us soon.</span></div> : <form onSubmit={submitNewsletter}><label htmlFor="newsletter-email">Your email address</label><div><input id="newsletter-email" name="email" type="email" placeholder="you@example.com" required /><button type="submit" disabled={newsletterBusy} aria-label="Subscribe"><ArrowRight /></button></div><small>By subscribing, you agree to receive occasional notes from Velora Studio.</small>{newsletterError && <p className="form-error">{newsletterError}</p>}</form>}
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main"><div className="footer-brand"><button className="brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>VELORA<span>STUDIO</span></button><p>Fewer things. Better feelings.<br />Made for the everyday.</p><a href="https://instagram.com" aria-label="Instagram"><Instagram /></a></div>
          <div className="footer-links"><div><strong>Explore</strong><button onClick={() => chooseCategory('All pieces')}>New arrivals</button><button onClick={() => chooseCategory('Clothing')}>Clothing</button><button onClick={() => chooseCategory('Accessories')}>Accessories</button><button onClick={() => chooseCategory('Footwear')}>Footwear</button></div><div><strong>Here to help</strong><button onClick={() => setToast('Email us at hello@velora.studio')}>Contact us</button><button onClick={() => setToast('Complimentary shipping on orders over $100.')}>Shipping & returns</button><button onClick={() => setToast('We are here to help. hello@velora.studio')}>FAQs</button><button onClick={() => setToast('Your privacy matters to us.')}>Privacy</button></div></div>
        </div><div className="footer-bottom"><span>© 2026 VELORA STUDIO</span><span>MADE WITH INTENTION.</span><span>USD · ENGLISH</span></div>
      </footer>

      {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}

      {cartOpen && <><button className="overlay" aria-label="Close bag" onClick={() => setCartOpen(false)} /><aside className="cart-panel" aria-label="Shopping bag">
        <div className="cart-header"><h2>Your bag <span>{itemCount}</span></h2><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close bag"><X /></button></div>
        {cart.length ? <><div className="cart-items">{cart.map(item => <div className="cart-item" key={item.id}><img src={item.image} alt="" /><div className="cart-item-info"><h3>{item.name}</h3><p>{item.color}</p><div className="quantity"><button onClick={() => changeQty(item.id, -1)} aria-label="Decrease quantity"><Minus /></button><span>{item.quantity}</span><button onClick={() => changeQty(item.id, 1)} aria-label="Increase quantity"><Plus /></button></div></div><strong>${item.price * item.quantity}</strong><button className="remove" onClick={() => setCart(items => items.filter(current => current.id !== item.id))} aria-label={`Remove ${item.name}`}><X size={15} /></button></div>)}</div>
          <div className="cart-footer"><div><span>Subtotal</span><strong>${subtotal}</strong></div><p>{subtotal >= 100 ? 'Your order ships free.' : `You're $${100 - subtotal} away from complimentary shipping.`}</p><button className="primary full" onClick={() => { setCheckoutError(''); setCheckoutOpen(true); }}>Continue to checkout <ArrowRight size={17} /></button><small>Taxes and delivery are calculated at checkout.</small></div>
        </> : <div className="empty-cart"><ShoppingBag /><h3>Room for something good.</h3><p>Your bag is taking a little breather.</p><button className="primary" onClick={() => setCartOpen(false)}>Explore the collection <ArrowRight size={16} /></button></div>}
      </aside></>}

      {checkoutOpen && <><button className="overlay checkout-overlay" aria-label="Close checkout" onClick={() => setCheckoutOpen(false)} /><aside className="checkout-panel" aria-label="Checkout">
        <button className="icon-button close-checkout" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout"><X /></button>
        {orderDone ? <div className="order-success"><div><Check /></div><p className="eyebrow">ORDER #{orderDone}</p><h2>Thank you.</h2><p>Your order is in our studio queue. We'll be in touch with the next steps.</p><button className="primary" onClick={() => { setOrderDone(''); setCheckoutOpen(false); setCartOpen(false); }}>Back to the good stuff</button></div>
          : <form onSubmit={submitOrder}><p className="eyebrow">A FEW DETAILS</p><h2>Where should we send it?</h2><p className="checkout-disclaimer">Demo checkout · no payment is collected.</p><div className="form-grid"><label>Full name<input name="name" autoComplete="name" required /></label><label>Email address<input name="email" type="email" autoComplete="email" required /></label><label className="wide">Address<input name="address" autoComplete="street-address" required /></label><label>City<input name="city" autoComplete="address-level2" required /></label><label>Postal code<input name="postal" autoComplete="postal-code" required /></label></div><div className="order-total"><span>Order total</span><strong>${subtotal}</strong></div>{checkoutError && <p className="form-error" role="alert">{checkoutError}</p>}<button className="primary full" type="submit">Place demo order <ArrowRight size={17} /></button></form>}
      </aside></>}
    </>
  );
}

createRoot(document.getElementById('app')).render(<React.StrictMode><App /></React.StrictMode>);
