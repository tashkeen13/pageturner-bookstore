import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Heart, LayoutDashboard, LogOut, Menu, Package, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';

export default function Navbar() {
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();

  const submitSearch = event => {
    event.preventDefault();
    const query = search.trim();
    setMenuOpen(false);
    navigate(query ? `/books?search=${encodeURIComponent(query)}` : '/books');
  };

  const handleLogout = () => {
    logout();
    setAccountOpen(false);
    setMenuOpen(false);
    toast.success('You have signed out.');
    navigate('/');
  };

  const closeMenu = () => { setMenuOpen(false); setAccountOpen(false); };

  return <>
    <div className="announcement-bar"><span>Thoughtful reads, delivered with care.</span><strong>Free delivery on orders over $50</strong></div>
    <header className="site-header">
      <div className="navbar-primary">
        <Link className="brand" to="/" aria-label="PageTurner home" onClick={closeMenu}><span className="brand-mark">P</span><span>PageTurner<small>BOOKS FOR THE CURIOUS</small></span></Link>
        <nav id="site-navigation" className={`primary-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
          <Link to="/books" onClick={closeMenu}>Shop books</Link>
          <Link to="/books?sort=newest" onClick={closeMenu}>New arrivals</Link>
          <Link to="/about" onClick={closeMenu}>Our story</Link>
        </nav>
      </div>
      <form className="nav-search" onSubmit={submitSearch} role="search">
        <Search size={17} aria-hidden="true" />
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search books or authors" aria-label="Search books or authors" />
        <button type="submit">Search</button>
      </form>
      <div className={`nav-actions${menuOpen ? ' is-open' : ''}`}>
        {isAuthenticated ? <div className="account-menu-wrap">
          <button className="account-menu-trigger" type="button" aria-expanded={accountOpen} onClick={() => setAccountOpen(value => !value)}><UserRound size={17} /><span>{user?.name?.split(' ')[0] || 'Account'}</span><ChevronDown size={14} /></button>
          {accountOpen && <div className="user-menu">
            <Link to="/profile" onClick={closeMenu}><UserRound size={15} />My profile</Link>
            <Link to="/orders" onClick={closeMenu}><Package size={15} />My orders</Link>
            {user?.role === 'admin' && <Link to="/admin" onClick={closeMenu}><LayoutDashboard size={15} />Admin workspace</Link>}
            <button type="button" onClick={handleLogout}><LogOut size={15} />Sign out</button>
          </div>}
        </div> : <Link className="account-link" to="/login" onClick={closeMenu}><UserRound size={17} />Sign in</Link>}
        <Link className="nav-icon-link" to="/wishlist" aria-label="Wishlist" title="Wishlist" onClick={closeMenu}><Heart size={19} /><span className="sr-only">Wishlist</span></Link>
        <Link className="cart-link" to="/cart" aria-label={`Shopping bag with ${itemCount} items`} onClick={closeMenu}><ShoppingBag size={19} /><span>Bag</span><b className="count-badge">{itemCount}</b></Link>
      </div>
      <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
    </header>
  </>;
}
