import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookHeart, Clock3, Feather, Leaf, Search, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import BookCard from '../components/BookCard';
import BookGridSkeleton from '../components/BookGridSkeleton';
import { fetchBooks, fetchGenres } from '../services/bookService';

const genreDescriptions = {
  'literary fiction': 'Quietly unforgettable', fantasy: 'Worlds beyond this one', mystery: 'One more chapter',
  romance: 'A little more heart', 'science fiction': 'Tomorrow, imagined', 'historical fiction': 'Stories through time', poetry: 'Words that stay'
};
const GenreIcons = [Search, Sparkles, BookHeart, Feather, Clock3, Leaf];

function BookShelf({ title, eyebrow, sort, genre, emptyMessage, className = '' }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetchBooks({ sort, genre, limit: 4 })
      .then(result => {
        if (!active) return;
        setBooks(result.books);
        setIsDemo(result.isDemo);
      })
      .catch(requestError => { if (active) setError(requestError.response?.data?.message || 'Books could not be loaded. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [sort, genre, retryCount]);

  return <section className={`featured-section ${className}`.trim()}>
    <div className="section-title"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><Link to={`/books?sort=${sort}`}>Shop the collection <ArrowRight size={15} /></Link></div>
    {isDemo && <div className="demo-notice"><strong>Preview catalog</strong><span>Sample titles are browse-only while the backend is unavailable.</span></div>}
    {loading ? <BookGridSkeleton count={4} />
      : error ? <div className="notice notice-error" role="alert">{error} <button className="small-button" onClick={() => setRetryCount(count => count + 1)}>Try again</button></div>
        : books.length ? <div className="book-grid">{books.map(book => <BookCard key={book._id} book={book} />)}</div>
          : <p className="muted">{emptyMessage}</p>}
  </section>;
}

export default function HomePage() {
  const [genres, setGenres] = useState([]);
  const [genresError, setGenresError] = useState(false);
  const [genresRetry, setGenresRetry] = useState(0);

  useEffect(() => {
    let active = true;
    fetchGenres().then(result => { if (active) setGenres(result.genres); }).catch(() => { if (active) setGenresError(true); });
    return () => { active = false; };
  }, [genresRetry]);

  return <main>
    <section className="home-hero">
      <div className="home-hero-inner">
        <div className="hero-copy"><span className="eyebrow">A BOOKSHOP FOR THE CURIOUS</span><h1>Make room<br />for a little <em>wonder.</em></h1><p>Stories to get lost in, voices to remember, and your next favorite waiting on the shelf.</p><div className="hero-actions"><Link className="button button-dark" to="/books">Shop now <ArrowRight size={17} /></Link><Link className="button button-outline" to="/#genres">Browse genres</Link></div><div className="hero-proof"><span><BookHeart size={16} /> Thoughtfully chosen</span><span><Sparkles size={16} /> Loved by readers</span></div></div>
        <div className="hero-art"><img src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1500&q=88" alt="A welcoming library filled with books" /><div className="hero-art-note"><span>YOUR NEXT CHAPTER</span><strong>Starts right<br />here.</strong><i>Find something wonderful.</i></div></div>
      </div>
    </section>
    <section className="service-strip" aria-label="Shopping benefits">
      <div className="service-item"><span><Truck size={20} /></span><div><strong>Free delivery over $50</strong><small>A little something on us</small></div></div>
      <div className="service-item"><span><ShieldCheck size={20} /></span><div><strong>Secure checkout</strong><small>Easy, safe payment</small></div></div>
      <div className="service-item"><span><Clock3 size={20} /></span><div><strong>Here for every reader</strong><small>Friendly help when you need it</small></div></div>
    </section>
    <BookShelf eyebrow="A FEW GOOD PLACES TO START" title="Featured books" sort="rating_desc" emptyMessage="New featured books are on their way." />
    <BookShelf eyebrow="READER FAVORITES" title="Bestsellers" sort="rating_desc" className="bestseller-shelf" emptyMessage="No reader favorites yet." />
    <BookShelf eyebrow="JUST ARRIVED" title="New arrivals" sort="newest" className="new-arrivals-shelf" emptyMessage="New arrivals are on their way." />
    <BookShelf eyebrow="IN URDU · اردو ادب" title="Stories close to home" sort="rating_desc" genre="Urdu Fiction" emptyMessage="Urdu novels are coming soon." />
    <section className="genre-section" id="genres"><div className="section-title"><div><span className="eyebrow">FOLLOW YOUR CURIOSITY</span><h2>Browse by genre</h2></div><Link to="/books">All books <ArrowRight size={15} /></Link></div>
      <div className="genre-grid">{genres.map((name, index) => { const Icon = GenreIcons[index % GenreIcons.length]; return <Link className={`genre-tile genre-tile-${index + 1}`} to={`/books?genre=${encodeURIComponent(name)}`} key={name}><span className="genre-icon" aria-hidden="true"><Icon size={20} /></span><span><strong>{name}</strong><small>{genreDescriptions[name.toLowerCase()] || 'Find your next favorite'}</small></span><b aria-hidden="true"><ArrowRight size={17} /></b></Link>; })}</div>
      {genresError && <p className="muted" role="alert">Book types could not be loaded. <button className="admin-inline-retry" onClick={() => { setGenresError(false); setGenresRetry(count => count + 1); }}>Try again</button></p>}
      {!genres.length && !genresError && <p className="muted">Loading book types...</p>}
    </section>
    <section className="genre-callout"><span className="eyebrow">NOT SURE WHERE TO BEGIN?</span><h2>There’s a whole world<br />on the next page.</h2><Link className="button button-light" to="/books">Explore every book <ArrowRight size={16} /></Link></section>
    <section className="newsletter"><div><span className="eyebrow">A LITTLE NOTE FROM US</span><h2>Good stories are better shared.</h2><p>Browse the shelves and get in touch if you need a hand choosing your next read.</p></div><Link className="button button-dark" to="/contact">Say hello <ArrowRight size={16} /></Link></section>
  </main>;
}
