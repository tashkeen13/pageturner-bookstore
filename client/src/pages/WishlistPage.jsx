import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BookCard from '../components/BookCard';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useCart } from '../hooks/useCart';
import { toggleWishlistBook } from '../services/wishlistService';
import { Heart } from 'lucide-react';
import { EmptyState } from '../components/ui';

export default function WishlistPage() {
  const { add } = useCart();
  const [books, setBooks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/users/wishlist').then(response => { if (active) setBooks(response.data.wishlist); })
      .catch(requestError => { if (active) setError(requestError.response?.data?.message || 'We could not load your wishlist. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retryCount]);

  const removeBook = async book => {
    try {
      await toggleWishlistBook(book._id);
      setBooks(current => current.filter(item => item._id !== book._id));
      toast.success('Removed from your wishlist.');
    } catch (requestError) { toast.error(requestError.response?.data?.message || 'Could not update your wishlist.'); }
  };

  const moveToCart = async book => {
    if (!add(book)) { toast.error(book.stock < 1 ? 'This book is out of stock.' : 'This title has reached its available stock.'); return; }
    try {
      await toggleWishlistBook(book._id);
      setBooks(current => current.filter(item => item._id !== book._id));
      toast.success('Moved to your bag.');
    } catch (requestError) { toast.error(requestError.response?.data?.message || 'The book is in your bag, but could not be removed from your wishlist.'); }
  };

  return <main className="page-shell"><div className="page-heading"><span className="eyebrow">YOUR SAVED STORIES</span><h1>For another day.</h1><p>Books you have tucked away for later.</p></div>
    {loading ? <div className="loading-state"><span className="spinner" />Loading your wishlist...</div>
      : error ? <div className="notice notice-error" role="alert">{error}<button className="small-button" onClick={() => setRetryCount(count => count + 1)}>Try again</button></div>
        : books.length ? <div className="wishlist-grid">{books.map(book => <div className="wishlist-entry" key={book._id}><BookCard book={book} onWishlistChange={inWishlist => { if (!inWishlist) setBooks(current => current.filter(item => item._id !== book._id)); }} /><div className="wishlist-entry-actions"><button className="button button-dark" disabled={book.stock < 1} onClick={() => moveToCart(book)}>{book.stock < 1 ? 'Out of stock' : 'Move to bag'}</button><button className="text-link" onClick={() => removeBook(book)}>Remove from wishlist</button></div></div>)}</div>
          : <EmptyState icon={Heart} title="Your wishlist is waiting." action={<Link className="button button-dark" to="/books">Explore books</Link>}>Save a book you love and it will find a place here.</EmptyState>}
  </main>;
}
