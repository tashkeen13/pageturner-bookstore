import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { getWishlistIds, toggleWishlistBook } from '../services/wishlistService';
import BookCover from './BookCover';
import { Button, RatingStars } from './ui';

export default function BookCard({ book, onWishlistChange }) {
  const { add } = useCart();
  const { isAuthenticated } = useAuth();
  const [saved, setSaved] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const previewOnly = String(book._id || '').startsWith('demo');

  useEffect(() => {
    let active = true;
    if (isAuthenticated && !previewOnly) getWishlistIds()
      .then(ids => { if (active) setSaved(ids.has(book._id)); })
      .catch(() => {});
    else setSaved(false);
    return () => { active = false; };
  }, [book._id, isAuthenticated, previewOnly]);

  const addBook = () => {
    if (add(book)) toast.success('Added to your bag');
    else toast.error('This title has reached its available stock.');
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Sign in to save books to your wishlist.'); return; }
    setWishlistBusy(true);
    try {
      const response = await toggleWishlistBook(book._id);
      setSaved(response.inWishlist);
      onWishlistChange?.(response.inWishlist);
      toast.success(response.inWishlist ? 'Added to your wishlist.' : 'Removed from your wishlist.');
    } catch (error) { toast.error(error.response?.data?.message || 'Wishlist could not be updated.'); }
    finally { setWishlistBusy(false); }
  };

  return (
    <article className="book-card">
      <Link className="book-cover" to={`/books/${book._id}`}>
        <BookCover book={book} />
      </Link>
      <button type="button" className={`book-card-heart${saved ? ' saved' : ''}`} aria-label={saved ? `Remove ${book.title} from wishlist` : `Add ${book.title} to wishlist`} aria-pressed={saved} disabled={wishlistBusy || previewOnly} onClick={toggleWishlist}><Heart size={18} fill={saved ? 'currentColor' : 'none'} /></button>
      <div className="book-details">
        <Link className="book-title" to={`/books/${book._id}`}>{book.title}</Link>
        <p className="book-author">by {book.author}</p>
        {Number(book.numReviews) > 0 && <div className="book-rating"><RatingStars value={book.averageRating} count={book.numReviews} /></div>}
        <div className="book-card-bottom">
          <strong>${Number(book.price).toFixed(2)}</strong>
          <Button type="button" variant="primary" size="sm" className="small-button" onClick={addBook} disabled={book.stock < 1 || previewOnly} title={previewOnly ? 'Preview titles cannot be purchased' : undefined}>
            {previewOnly ? 'Preview only' : book.stock < 1 ? 'Sold out' : 'Add to bag'}
          </Button>
        </div>
      </div>
    </article>
  );
}
