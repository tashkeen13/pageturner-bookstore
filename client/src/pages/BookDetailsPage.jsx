import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import api from '../services/api';
import { fetchBook, fetchBooks, fetchReviews } from '../services/bookService';
import BookCover from '../components/BookCover';
import { toggleWishlistBook } from '../services/wishlistService';
import { Breadcrumbs, RatingStars } from '../components/ui';
import { Minus, Plus } from 'lucide-react';

function LoadingSpinner({ label = 'Loading…' }) {
  return <div className="loading-state"><span className="spinner" />{label}</div>;
}

export default function BookDetailsPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { add } = useCart();
  const [book, setBook] = useState(null);
  const [bookDemo, setBookDemo] = useState(false);
  const [bookLoading, setBookLoading] = useState(true);
  const [bookError, setBookError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [similarBooks, setSimilarBooks] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(true);
  const [similarError, setSimilarError] = useState('');
  const [wishlist, setWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [quantity, setQuantity] = useState(1);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const ownReview = reviews.find(review => review.user?._id === user?.id || review.user?._id === user?._id);

  useEffect(() => {
    let active = true;
    setBook(null);
    setBookLoading(true);
    setBookError('');
    fetchBook(id)
      .then(result => {
        if (!active) return;
        setBook(result.book);
        setBookDemo(result.isDemo);
      })
      .catch(requestError => {
        if (active) setBookError(requestError.response?.data?.message || 'We could not load this book. Please try again.');
      })
      .finally(() => { if (active) setBookLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    setReviews([]);
    setReviewsError('');
    setReviewsLoading(true);
    fetchReviews(id)
      .then(result => { if (active) setReviews(result.reviews); })
      .catch(requestError => {
        if (active) setReviewsError(requestError.response?.data?.message || 'Reviews could not be loaded.');
      })
      .finally(() => { if (active) setReviewsLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!book) return undefined;
    let active = true;
    setSimilarBooks([]);
    setSimilarLoading(true);
    setSimilarError('');
    fetchBooks({ genre: book.genre, sort: 'rating_desc', limit: 5 })
      .then(result => {
        if (!active) return;
        setSimilarBooks(result.books.filter(item => item._id !== book._id).slice(0, 4));
        setSimilarLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setSimilarError('Similar books are temporarily unavailable.');
        setSimilarLoading(false);
      });
    return () => { active = false; };
  }, [book]);

  useEffect(() => {
    if (!book || bookDemo || !isAuthenticated) {
      setWishlist(false);
      return undefined;
    }
    let active = true;
    api.get('/users/wishlist')
      .then(response => {
        if (active) setWishlist(response.data.wishlist.some(item => item._id === book._id));
      })
      .catch(() => {
        if (active) toast.error('Your wishlist status could not be loaded.');
      });
    return () => { active = false; };
  }, [book, bookDemo, isAuthenticated]);

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to save books to your wishlist.');
      return;
    }
    setWishlistBusy(true);
    try {
      const response = await toggleWishlistBook(book._id);
      setWishlist(response.inWishlist);
      toast.success(response.message);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Wishlist could not be updated.');
    } finally {
      setWishlistBusy(false);
    }
  };

  const addBookToBag = () => {
    if (add(book, quantity)) toast.success(`${quantity} ${quantity === 1 ? 'copy' : 'copies'} added to your bag.`);
    else toast.error('This title has reached its available stock.');
  };

  const submitReview = async event => {
    event.preventDefault();
    setReviewError('');
    setReviewBusy(true);
    try {
      const payload = {
        rating: Number(rating),
        comment: comment.trim()
      };
      const response = editingReview
        ? await api.patch(`/books/${book._id}/reviews/${editingReview._id}`, payload)
        : await api.post(`/books/${book._id}/reviews`, payload);
      setReviews(current => editingReview
        ? current.map(review => review._id === editingReview._id ? response.data.review : review)
        : [response.data.review, ...current]);
      setBook(current => ({
        ...current,
        averageRating: response.data.averageRating,
        numReviews: response.data.numReviews
      }));
      setComment('');
      setRating('5');
      setEditingReview(null);
      toast.success(editingReview ? 'Your review has been updated.' : 'Your review has been added.');
    } catch (requestError) {
      setReviewError(requestError.response?.data?.details?.join(' ') || requestError.response?.data?.message || 'Your review could not be submitted.');
    } finally {
      setReviewBusy(false);
    }
  };

  const startReviewEdit = () => {
    setEditingReview(ownReview);
    setRating(String(ownReview.rating));
    setComment(ownReview.comment);
    setReviewError('');
    document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const deleteReview = async () => {
    if (!ownReview || !window.confirm('Delete your review?')) return;
    setReviewBusy(true);
    try {
      const response = await api.delete(`/books/${book._id}/reviews/${ownReview._id}`);
      setReviews(current => current.filter(review => review._id !== ownReview._id));
      setBook(current => ({ ...current, averageRating: response.data.averageRating, numReviews: response.data.numReviews }));
      setEditingReview(null); setComment(''); setRating('5');
      toast.success('Your review was deleted.');
    } catch (requestError) { toast.error(requestError.response?.data?.message || 'Your review could not be deleted.'); }
    finally { setReviewBusy(false); }
  };

  if (bookLoading) return <main className="page-shell"><LoadingSpinner label="Opening the book…" /></main>;
  if (bookError || !book) return <main className="page-shell"><div className="empty-state"><h1>{bookError || 'Book not found.'}</h1><Link className="text-link" to="/books">Back to books</Link></div></main>;

  return (
    <main className="page-shell detail-page">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Books', to: '/books' }, { label: book.title }]} />
      {bookDemo && <div className="demo-notice"><strong>Preview book</strong><span>This sample title is not in the live catalog, so it cannot be purchased or saved. Reviews are read-only in preview.</span></div>}
      <div className="book-detail-layout">
        <div className="detail-cover"><BookCover book={book} /></div>
        <div className="detail-copy">
          <span className="eyebrow">{book.genre}</span><h1>{book.title}</h1><p className="detail-author">by {book.author}</p>
          <p className="rating-line"><RatingStars value={book.averageRating} count={book.numReviews} /> <a href="#reviews">Read reviews</a></p>
          <div className="detail-tabs" role="tablist" aria-label="Book information">{[['description', 'Description'], ['details', 'Details'], ['reviews', `Reviews (${book.numReviews})`]].map(([tab, label]) => <button type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'active' : ''} key={tab} onClick={() => setActiveTab(tab)}>{label}</button>)}</div>
          <div className="detail-tab-panel" role="tabpanel">{activeTab === 'description' ? <p className="detail-description">{book.description}</p>
            : activeTab === 'details' ? <div className="detail-meta"><span>Publisher</span><strong>{book.publisher || '—'}</strong><span>Language</span><strong>{book.language || '—'}</strong><span>Pages</span><strong>{book.pages || '—'}</strong><span>{/^\d{13}$/.test(book.isbn) ? 'ISBN' : 'Catalog ID'}</span><strong>{book.isbn || '—'}</strong></div>
              : <div className="detail-review-summary"><RatingStars value={book.averageRating} count={book.numReviews} /><p>See what readers are saying about this title.</p><a href="#reviews">Read all reviews</a></div>}</div>
          <p className={`stock-status ${book.stock > 0 ? 'in-stock' : 'out-stock'}`}>{book.stock > 0 ? `${book.stock} in stock · ready to ship` : 'Currently out of stock'}</p>
          <div className="detail-purchase"><strong>${Number(book.price).toFixed(2)}</strong><div className="detail-quantity" aria-label="Choose quantity"><button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(value => Math.max(1, value - 1))}><Minus size={14} /></button><input aria-label="Quantity" type="number" min="1" max={Math.min(book.stock || 1, 99)} value={quantity} onChange={event => setQuantity(Math.max(1, Math.min(Number(event.target.value) || 1, Math.max(1, Math.min(book.stock || 1, 99)))))} /><button type="button" aria-label="Increase quantity" disabled={quantity >= Math.min(book.stock || 1, 99)} onClick={() => setQuantity(value => Math.min(Math.min(book.stock || 1, 99), value + 1))}><Plus size={14} /></button></div><button className="button button-dark" disabled={book.stock < 1 || bookDemo} onClick={addBookToBag}>{bookDemo ? 'Preview only' : book.stock < 1 ? 'Out of stock' : 'Add to bag'}</button><button className={`wishlist-button ${wishlist ? 'saved' : ''}`} onClick={toggleWishlist} disabled={wishlistBusy || bookDemo} aria-pressed={wishlist}>{wishlist ? '♥ Saved' : '♡ Wishlist'}</button></div>
          {bookDemo && <p className="muted small-note">Preview titles are for browsing only and cannot be purchased. Connect the live catalog to place orders.</p>}
        </div>
      </div>

      <section className="reviews-section" id="reviews">
        <div className="section-title"><div><span className="eyebrow">NOTES FROM READERS</span><h2>Reviews <span className="review-count">({book.numReviews})</span></h2></div></div>
        {reviewsLoading ? <LoadingSpinner label="Loading reviews…" />
          : reviewsError ? <div className="notice notice-error" role="alert">{reviewsError}</div>
            : reviews.length ? <div className="review-list">{reviews.map(review => (
              <article className="review-card" key={review._id}>
                <div className="review-card-head"><strong>{review.user?.name || 'Reader'}</strong><span aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></div>
                <p>{review.comment}</p>
                <time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString()}</time>
                {(review.user?._id === user?.id || review.user?._id === user?._id) && <div className="own-review-actions"><button type="button" className="text-link" onClick={startReviewEdit}>Edit</button><button type="button" className="text-link" disabled={reviewBusy} onClick={deleteReview}>Delete</button></div>}
              </article>
            ))}</div>
              : <p className="muted">No reviews yet. Be the first to share what you thought.</p>}

        {bookDemo ? <p className="demo-review-note">Submit a review when the live book catalog is connected.</p>
          : isAuthenticated && (!ownReview || editingReview) ? <form id="review-form" className="review-form" onSubmit={submitReview}>
            <h3>{editingReview ? 'Edit your review' : 'Leave a review'}</h3>
            <label>Your rating<select value={rating} onChange={event => setRating(event.target.value)}>{[5, 4, 3, 2, 1].map(value => <option value={value} key={value}>{value} {value === 1 ? 'star' : 'stars'}</option>)}</select></label>
            <label>Your comments<textarea value={comment} onChange={event => setComment(event.target.value)} rows="4" minLength="2" maxLength="2000" placeholder="What did you think of this book?" required /></label>
            {reviewError && <p className="form-error" role="alert">{reviewError}</p>}
            <button className="button button-dark" disabled={reviewBusy}>{reviewBusy ? 'Saving…' : editingReview ? 'Save review' : 'Submit review'}</button>
            {editingReview && <button type="button" className="button button-light" onClick={() => { setEditingReview(null); setRating('5'); setComment(''); }}>Cancel edit</button>}
          </form>
            : isAuthenticated ? <p className="review-signin">You’ve already reviewed this book. Use Edit or Delete above to manage your review.</p>
            : <p className="review-signin"><Link to="/login">Sign in</Link> to leave a review.</p>}
      </section>

      <section className="similar-section">
        <div className="section-title"><div><span className="eyebrow">MORE FROM THE SHELVES</span><h2>Similar reads.</h2></div><Link to={`/books?genre=${encodeURIComponent(book.genre)}`}>More {book.genre} <span aria-hidden="true">→</span></Link></div>
        {similarError ? <p className="notice notice-error">{similarError}</p>
          : similarBooks.length ? <div className="book-grid">{similarBooks.map(item => <article className="book-card" key={item._id}><Link className="book-cover" to={`/books/${item._id}`}><BookCover book={item} /></Link><div className="book-details"><Link className="book-title" to={`/books/${item._id}`}>{item.title}</Link><p className="book-author">by {item.author}</p><div className="book-card-bottom"><strong>${Number(item.price).toFixed(2)}</strong><span className="similar-rating">★ {Number(item.averageRating).toFixed(1)}</span></div></div></article>)}</div>
            : similarLoading ? <LoadingSpinner label="Finding similar books…" /> : <p className="muted">No similar books found yet.</p>}
      </section>
      <div className="mobile-buy-bar"><strong>${Number(book.price).toFixed(2)}</strong><button className="button button-dark" disabled={book.stock < 1 || bookDemo} onClick={addBookToBag}>{book.stock < 1 ? 'Out of stock' : 'Add to bag'}</button></div>
    </main>
  );
}
