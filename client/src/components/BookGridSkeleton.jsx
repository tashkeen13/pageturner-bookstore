import { Skeleton } from './ui';

export default function BookGridSkeleton({ count = 4 }) {
  return <div className="book-grid book-grid-skeleton" aria-label="Loading books" aria-busy="true">{Array.from({ length: count }, (_, index) => <div className="skeleton-book-card" key={index}><Skeleton className="skeleton-cover" /><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line short" /><Skeleton className="skeleton-line bottom" /></div>)}</div>;
}
