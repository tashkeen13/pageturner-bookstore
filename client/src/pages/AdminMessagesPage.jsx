import { useCallback, useEffect, useState } from 'react';
import { Mail, MailOpen } from 'lucide-react';
import api from '../services/api';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalMessages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  const loadMessages = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await api.get('/admin/messages', { params: { page, limit: 15 } });
      setMessages(response.data.messages);
      setPagination(response.data.pagination);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Contact messages could not be loaded.');
    } finally { setLoading(false); }
  }, [page]);
  useEffect(() => { loadMessages(); }, [loadMessages, retry]);

  return <div className="admin-page">
    <div className="admin-page-heading"><div><span className="eyebrow">CUSTOMER SUPPORT</span><h1>Contact messages</h1><p>Read messages sent through the PageTurner contact form.</p></div><span className="admin-count"><Mail size={15} /> {pagination.totalMessages} messages</span></div>
    {error && <div className="notice notice-error" role="alert">{error}<button className="admin-inline-retry" onClick={() => setRetry(value => value + 1)}>Try again</button></div>}
    {loading ? <div className="loading-state"><span className="spinner" />Loading messages...</div>
      : messages.length ? <section className="admin-messages-list" aria-label="Contact message inbox">{messages.map(message => <article className="admin-message-card" key={message._id}>
        <header><span className="admin-message-icon"><MailOpen size={17} /></span><div><h2>{message.name}</h2><a href={`mailto:${encodeURIComponent(message.email)}`}>{message.email}</a></div><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time></header>
        <p>{message.message}</p>
        <a className="button button-light admin-reply-link" href={`mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent('PageTurner support')}`}>Reply by email</a>
      </article>)}
      {pagination.totalPages > 1 && <div className="admin-pagination"><span>{pagination.totalMessages} messages · Page {page} of {pagination.totalPages}</span><div><button className="button button-light" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><button className="button button-light" disabled={page >= pagination.totalPages} onClick={() => setPage(value => value + 1)}>Next</button></div></div>}</section>
        : <section className="admin-panel"><p className="admin-empty">No contact messages yet.</p></section>}
  </div>;
}
