import { useState } from 'react';

const palette = {
  Fantasy: ['#243d38', '#d7ae69'],
  Mystery: ['#273347', '#c98b67'],
  Romance: ['#784d56', '#f0c9a8'],
  'Science Fiction': ['#243b51', '#87c1b6'],
  'Historical Fiction': ['#735443', '#e3c08b'],
  'Literary Fiction': ['#435246', '#d5c9a9'],
  'Urdu Fiction': ['#315247', '#d8b977']
};

function resolveCoverSource(source) {
  if (!source?.startsWith('/uploads/')) return source;
  const configuredApiUrl = import.meta.env.VITE_API_URL;
  const assetOrigin = configuredApiUrl
    ? new URL(configuredApiUrl, window.location.origin).origin
    : import.meta.env.DEV ? 'http://127.0.0.1:5000' : window.location.origin;
  return `${assetOrigin}${source}`;
}

export default function BookCover({ book, className = '' }) {
  const [failedSource, setFailedSource] = useState('');
  const [background, accent] = palette[book.genre] || ['#4b4b58', '#d5bd8d'];
  const hasRealArt = book.coverImage && !book.coverImage.includes('covers.openlibrary.org');
  const source = resolveCoverSource(book.coverImage);

  if (hasRealArt && failedSource !== source) {
    return <img className={className} src={source} alt={`Cover of ${book.title}`} loading="lazy" onError={() => setFailedSource(source)} />;
  }

  return (
    <div className={`designed-cover ${className}`} style={{ '--cover-bg': background, '--cover-accent': accent }} role="img" aria-label={`Illustrated cover for ${book.title}`}>
      <span className="cover-topline">PAGETURNER · {book.genre || 'FICTION'}</span>
      <span className="cover-orbit" aria-hidden="true"><i /><b /></span>
      <span className="cover-title">{book.title}</span>
      {book.language === 'Urdu' && <span className="cover-urdu" lang="ur" dir="rtl">{book.title === 'Jannat Kay Pattay' ? 'جنت کے پتے' : 'جو بچے ہیں سنگ سمیٹ لو'}</span>}
      <span className="cover-rule" />
      <span className="cover-author">{book.author}</span>
    </div>
  );
}
