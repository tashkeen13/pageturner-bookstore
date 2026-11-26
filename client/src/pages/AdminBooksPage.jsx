import { useCallback, useEffect, useState } from 'react';
import { ImagePlus, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import BookCover from '../components/BookCover';
import { Modal } from '../components/ui';

const emptyBook = {
  title: '', author: '', description: '', price: '', stock: '', genre: '',
  language: 'English', publisher: '', isbn: '', pages: '', coverImage: ''
};

const fields = [
  ['title', 'Title', 'text'], ['author', 'Author', 'text'], ['genre', 'Genre', 'text'],
  ['price', 'Price (USD)', 'number'], ['stock', 'Stock', 'number'],
  ['language', 'Language', 'text'], ['publisher', 'Publisher', 'text'],
  ['isbn', 'ISBN', 'text'], ['pages', 'Pages', 'number']
];

export default function AdminBooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalBooks: 0 });
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyBook);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [genres, setGenres] = useState([]);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/books', { params: { page, limit: 20, sort: 'title_asc', search: search || undefined, genre: genre || undefined } });
      setBooks(response.data.books);
      setPagination(response.data.pagination);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Books could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [page, search, genre]);

  useEffect(() => { loadBooks(); }, [loadBooks]);
  useEffect(() => { api.get('/books/genres').then(response => setGenres(response.data.genres)).catch(() => toast.error('Book types could not be loaded.')); }, []);

  const visibleBooks = books;

  const applyFilters = event => {
    event.preventDefault();
    setPage(1);
    setSearch(searchQuery.trim());
  };

  const openForm = book => {
    setFormOpen(true);
    setEditing(book?._id || null);
    setForm(book ? { ...emptyBook, ...book } : emptyBook);
  };

  const closeForm = () => {
    if (busy || uploading) return;
    setFormOpen(false);
    setEditing(null);
    setForm(emptyBook);
  };

  const changeField = event => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
  };

  const uploadCover = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Choose a JPEG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Cover images must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }
    const data = new FormData();
    data.append('cover', file);
    setUploading(true);
    try {
      const response = await api.post('/admin/upload-cover', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(current => ({ ...current, coverImage: response.data.image.url }));
      toast.success('Cover uploaded to local storage.');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Cover upload failed.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const saveBook = async event => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        pages: Number(form.pages)
      };
      if (editing) await api.put(`/books/${editing}`, payload);
      else await api.post('/books', payload);
      toast.success(editing ? 'Book updated.' : 'Book added.');
      setFormOpen(false);
      setEditing(null);
      setForm(emptyBook);
      await loadBooks();
    } catch (requestError) {
      toast.error(requestError.response?.data?.details?.join(' ') || requestError.response?.data?.message || 'Book could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const deleteBook = async book => {
    if (!window.confirm(`Delete "${book.title}" from the catalog?`)) return;
    try {
      await api.delete(`/books/${book._id}`);
      toast.success('Book deleted.');
      if (books.length === 1 && page > 1) setPage(current => current - 1);
      else await loadBooks();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Book could not be deleted.');
    }
  };

  return <div className="admin-page">
    <div className="admin-page-heading"><div><span className="eyebrow">CATALOG</span><h1>Manage books</h1><p>Add, update, and remove titles from your shelves.</p></div><button className="button button-dark" onClick={() => openForm(null)}><Plus size={16} />Add book</button></div>
    {error && <div className="notice notice-error" role="alert">{error}<button className="admin-inline-retry" onClick={loadBooks}>Retry</button></div>}
    <form className="admin-toolbar admin-books-filters" onSubmit={applyFilters}><label className="admin-search"><span className="sr-only">Search all books</span><input type="search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search title or author" /></label><label className="admin-genre-filter">Book type<select value={genre} onChange={event => { setGenre(event.target.value); setPage(1); }}><option value="">All book types</option>{genres.map(value => <option key={value} value={value}>{value}</option>)}</select></label><button className="button button-dark" type="submit"><Search size={15} />Search</button><span>{pagination.totalBooks} books</span></form>
    {loading ? <div className="loading-state"><span className="spinner" />Loading books…</div> : <section className="admin-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Book</th><th>ISBN</th><th>Genre</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>{visibleBooks.map(book => <tr key={book._id}><td><div className="admin-book-cell"><BookCover book={book} className="admin-book-image" /><span><strong>{book.title}</strong><small>{book.author}</small></span></div></td><td>{book.isbn}</td><td>{book.genre}</td><td>${Number(book.price).toFixed(2)}</td><td><span className={book.stock <= 10 ? 'stock-warning' : ''}>{book.stock}</span></td><td><div className="admin-row-actions"><button title={`Edit ${book.title}`} aria-label={`Edit ${book.title}`} onClick={() => openForm(book)}><Pencil size={15} /></button><button title={`Delete ${book.title}`} aria-label={`Delete ${book.title}`} onClick={() => deleteBook(book)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table>{!visibleBooks.length && !error && <p className="admin-empty">{search ? `No books match ${search}.` : <>No books on this page.</>}</p>}</div><div className="admin-pagination"><span>{pagination.totalBooks} books · Page {pagination.page} of {pagination.totalPages || 1}</span><div><button className="button button-light" disabled={loading || page <= 1} onClick={() => setPage(current => current - 1)}>Previous</button><button className="button button-light" disabled={loading || page >= pagination.totalPages} onClick={() => setPage(current => current + 1)}>Next</button></div></div></section>}

    {formOpen && <Modal title={editing ? 'Update book' : 'Add a book'} onClose={closeForm} className="admin-modal">
        <form className="admin-book-form" onSubmit={saveBook}>
          <div className="admin-book-fields">{fields.map(([name, label, type]) => <label key={name}>{label}<input name={name} type={type} required min={type === 'number' ? (name === 'price' ? '0' : name === 'stock' ? '0' : '1') : undefined} step={name === 'price' ? '0.01' : type === 'number' ? '1' : undefined} value={form[name] ?? ''} onChange={changeField} /></label>)}</div>
          <label>Description<textarea name="description" rows="4" maxLength="5000" required value={form.description} onChange={changeField} /></label>
          <div className="admin-cover-upload">
            {form.coverImage && <BookCover book={{ ...form, genre: form.genre || 'Literary Fiction' }} className="admin-preview-cover" />}
            <label className="cover-upload-button"><ImagePlus size={17} />{uploading ? 'Uploading…' : 'Choose cover from computer'}<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" disabled={uploading || busy} onChange={uploadCover} /></label>
            <span>JPG, JPEG, PNG or WebP · 5 MB max · Stored on this server</span>
          </div>
          <label>Cover image URL or saved path<input name="coverImage" type="text" required maxLength="2048" placeholder="Upload a cover or enter an HTTPS image URL" value={form.coverImage} onChange={changeField} /></label>
          <div className="admin-modal-actions"><button type="button" className="button button-light" onClick={closeForm} disabled={busy || uploading}>Cancel</button><button className="button button-dark" disabled={busy || uploading}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add book'}</button></div>
        </form>
    </Modal>}
  </div>;
}
