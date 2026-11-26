import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import BookCard from '../components/BookCard';
import { fetchBooks, fetchGenres } from '../services/bookService';
import BookGridSkeleton from '../components/BookGridSkeleton';
import { Filter, Search, X } from 'lucide-react';
import { EmptyState, Pagination, Select } from '../components/ui';

export default function BooksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalBooks: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterError, setFilterError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isDemo, setIsDemo] = useState(false);
  const [genres, setGenres] = useState([]);
  const [genresError, setGenresError] = useState('');
  const [genresRetry, setGenresRetry] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const search = searchParams.get('search') || '';
  const genre = searchParams.get('genre') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = searchParams.get('page') || '1';

  useEffect(() => {
    let active = true;
    fetchGenres()
      .then(result => { if (active) setGenres(result.genres); })
      .catch(() => { if (active) setGenresError('Book types could not be loaded. Please try again.'); });
    return () => { active = false; };
  }, [genresRetry]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetchBooks({
      search: search || undefined,
      genre: genre || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      sort,
      page,
      limit: 12
    })
      .then(result => {
        if (!active) return;
        setBooks(result.books);
        setPagination(result.pagination);
        setIsDemo(result.isDemo);
      })
      .catch(requestError => {
        if (active) setError(requestError.response?.data?.message || 'Books could not be loaded. Please try again.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, genre, sort, page, searchParams, retryCount]);

  useEffect(() => {
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
  }, [searchParams]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const submitPriceFilter = event => {
    event.preventDefault();
    const minimum = minPrice === '' ? undefined : Number(minPrice);
    const maximum = maxPrice === '' ? undefined : Number(maxPrice);
    if ((minimum !== undefined && (!Number.isFinite(minimum) || minimum < 0)) ||
        (maximum !== undefined && (!Number.isFinite(maximum) || maximum < 0))) {
      setFilterError('Enter a valid price of zero or more.');
      return;
    }
    if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
      setFilterError('Minimum price must be less than or equal to maximum price.');
      return;
    }
    setFilterError('');
    const next = new URLSearchParams(searchParams);
    if (minPrice) next.set('minPrice', minPrice);
    else next.delete('minPrice');
    if (maxPrice) next.set('maxPrice', maxPrice);
    else next.delete('maxPrice');
    next.delete('page');
    setSearchParams(next);
  };

  const changePage = nextPage => {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) next.delete('page');
    else next.set('page', String(nextPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setFilterError('');
    setSearchParams(search ? { search } : {});
  };

  return (
    <main className="page-shell">
      <div className="page-heading"><span className="eyebrow">THE PAGETURNER SHELVES</span><h1>{search ? `Results for “${search}”` : 'Browse the books.'}</h1><p>Find a new favorite, revisit an old one, or just see where the pages take you.</p></div>
      <button className="filter-toggle" type="button" aria-expanded={filterOpen} onClick={() => setFilterOpen(true)}><Filter size={17} /> Filters</button>
      <button className={`filter-scrim${filterOpen ? ' is-visible' : ''}`} type="button" aria-label="Close filters" onClick={() => setFilterOpen(false)} />
      <div className="catalog-layout">
        <aside className={`catalog-sidebar${filterOpen ? ' is-open' : ''}`}>
          <div className="filter-drawer-head"><strong>Filters</strong><button type="button" aria-label="Close filters" onClick={() => setFilterOpen(false)}><X size={18} /></button></div>
          <div>
            <Select label="Book type" className="filter-field" value={genre} onChange={event => setParam('genre', event.target.value)}><option value="">All book types</option>{genre && !genres.some(value => value.toLowerCase() === genre.toLowerCase()) && <option value={genre}>{genre}</option>}{genres.map(value => <option key={value} value={value}>{value}</option>)}</Select>
            {genresError && <button type="button" className="admin-inline-retry" onClick={() => { setGenresError(''); setGenresRetry(count => count + 1); }}>Retry book types</button>}
          </div>
          <form className="price-filter" onSubmit={submitPriceFilter}>
            <strong>Price range</strong>
            <div><label><span>Min</span><input aria-label="Minimum price" type="number" min="0" step="0.01" value={minPrice} onChange={event => setMinPrice(event.target.value)} placeholder="$0" /></label><label><span>Max</span><input aria-label="Maximum price" type="number" min="0" step="0.01" value={maxPrice} onChange={event => setMaxPrice(event.target.value)} placeholder="No limit" /></label></div>
            <button type="submit" className="small-button">Apply price</button>
            {filterError && <p className="form-error" role="alert">{filterError}</p>}
          </form>
          <button className="clear-filters" onClick={clearFilters}>Clear filters</button>
        </aside>
        <section className="catalog-results">
          <div className="catalog-toolbar">
            <span>{loading ? 'Finding books…' : `${pagination.totalBooks} ${pagination.totalBooks === 1 ? 'book' : 'books'}`}</span>
            <label>Sort<select value={sort} onChange={event => setParam('sort', event.target.value)}><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="rating_desc">Top rated</option><option value="title_asc">Title: A to Z</option></select></label>
          </div>
          {(search || genre || searchParams.has('minPrice') || searchParams.has('maxPrice')) && <div className="filter-chips" aria-label="Active filters">{search && <button onClick={() => setParam('search', '')}>Search: {search} <X size={13} /></button>}{genre && <button onClick={() => setParam('genre', '')}>{genre} <X size={13} /></button>}{(searchParams.has('minPrice') || searchParams.has('maxPrice')) && <button onClick={() => { const next = new URLSearchParams(searchParams); next.delete('minPrice'); next.delete('maxPrice'); setSearchParams(next); }}>Price range <X size={13} /></button>}</div>}
          {isDemo && <div className="demo-notice" role="status"><strong>Preview catalog</strong><span>Sample titles are browse-only while the backend is unavailable.</span><button onClick={() => setRetryCount(count => count + 1)}>Retry API</button></div>}
          {loading ? <BookGridSkeleton count={8} />
            : error ? <div className="notice notice-error" role="alert">{error} <button className="small-button" onClick={() => setRetryCount(count => count + 1)}>Try again</button></div>
              : books.length ? <>
                <div className="book-grid">{books.map(book => <BookCard key={book._id} book={book} />)}</div>
                <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={changePage} />
              </> : <EmptyState icon={Search} title="No books found" action={<button className="small-button" onClick={clearFilters}>Clear filters</button>}>Try a different title, author, or filter.</EmptyState>}
        </section>
      </div>
    </main>
  );
}
