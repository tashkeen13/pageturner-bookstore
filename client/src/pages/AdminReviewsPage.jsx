import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalReviews: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const loadReviews = useCallback(async () => {
    setLoading(true); setError('');
    try { const { data } = await api.get('/admin/reviews', { params: { page, limit: 20 } }); setReviews(data.reviews); setPagination(data.pagination); }
    catch (err) { setError(err.response?.data?.message || 'Reviews could not be loaded.'); }
    finally { setLoading(false); }
  }, [page]);
  useEffect(() => { loadReviews(); }, [loadReviews]);

  const deleteReview = async review => {
    if (!window.confirm(`Delete this ${review.rating}-star review of “${review.book?.title || 'this book'}”? The book rating will be recalculated.`)) return;
    setBusyId(review._id);
    try {
      await api.delete(`/admin/reviews/${review._id}`);
      toast.success('Review deleted and book rating updated.');
      if (reviews.length === 1 && page > 1) setPage(value => value - 1);
      else await loadReviews();
    } catch (err) { toast.error(err.response?.data?.message || 'Review could not be deleted.'); }
    finally { setBusyId(''); }
  };
  return <div className="admin-page">
    <div className="admin-page-heading"><div><span className="eyebrow">CUSTOMER FEEDBACK</span><h1>Manage reviews</h1><p>Review customer feedback and keep book ratings accurate.</p></div></div>
    {error && <div className="notice notice-error" role="alert">{error}<button className="admin-inline-retry" onClick={loadReviews}>Try again</button></div>}
    {loading ? <div className="loading-state"><span className="spinner" />Loading reviews...</div> : <section className="admin-panel"><div className="admin-table-wrap"><table className="admin-table admin-reviews-table"><thead><tr><th>Book</th><th>Customer</th><th>Rating</th><th>Review</th><th>Date</th><th>Action</th></tr></thead><tbody>
      {reviews.map(review => <tr key={review._id}><td><strong>{review.book?.title || 'Book removed'}</strong></td><td>{review.user?.name || 'User removed'}<small className="admin-cell-subtext">{review.user?.email || ''}</small></td><td><span className="admin-review-stars" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></td><td className="admin-review-comment">{review.comment}</td><td>{new Date(review.createdAt).toLocaleDateString()}</td><td><button className="admin-danger-button" disabled={busyId === review._id} onClick={() => deleteReview(review)}><Trash2 size={15} /> Delete</button></td></tr>)}
    </tbody></table>{!reviews.length && !error && <p className="admin-empty">No reviews have been submitted.</p>}</div>
    <div className="admin-pagination"><span>{pagination.totalReviews} reviews · Page {page} of {pagination.totalPages || 1}</span><div><button className="button button-light" disabled={loading || page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><button className="button button-light" disabled={loading || page >= pagination.totalPages} onClick={() => setPage(value => value + 1)}>Next</button></div></div></section>}
  </div>;
}
