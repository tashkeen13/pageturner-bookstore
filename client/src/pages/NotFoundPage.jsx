import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return <main className="page-shell"><div className="empty-state"><span className="eyebrow">404 · LOST YOUR PLACE?</span><h1>This page isn’t on our shelves.</h1><p>Let’s get you back to a good story.</p><Link className="button button-dark" to="/">Back to PageTurner</Link></div></main>;
}
