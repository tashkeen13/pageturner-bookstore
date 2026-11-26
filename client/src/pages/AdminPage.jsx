import { Link } from 'react-router-dom';

export default function AdminPage() {
  return <main className="page-shell"><div className="page-heading"><span className="eyebrow">PAGETURNER ADMIN</span><h1>Bookshop overview.</h1><p>You’re signed in with administrator access.</p></div><section className="admin-placeholder"><h2>Manage the shelves.</h2><p>Book and order management screens will be added in their own project step. For now, you can browse the public catalog.</p><Link className="button button-dark" to="/books">Browse catalog</Link></section></main>;
}
