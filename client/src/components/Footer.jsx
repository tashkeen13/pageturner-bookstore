import { Link } from 'react-router-dom';
import { Mail, MoveUpRight, Users } from 'lucide-react';

function FooterColumn({ title, children }) {
  return <nav className="footer-links" aria-label={title}><h3>{title}</h3>{children}</nav>;
}

export default function Footer() {
  return <footer className="site-footer">
    <div className="footer-main">
      <div className="footer-about"><Link className="footer-brand" to="/">PageTurner</Link><p>A little bookshop for the curious. Thoughtful reads and stories worth keeping.</p><Link className="footer-about-link" to="/about">A note about us <MoveUpRight size={14} /></Link></div>
      <FooterColumn title="Shop"><Link to="/books">All books</Link><Link to="/books?sort=newest">New arrivals</Link><Link to="/books?sort=rating_desc">Readers’ favorites</Link><Link to="/wishlist">Your wishlist</Link></FooterColumn>
      <FooterColumn title="Help"><Link to="/contact">Contact us</Link><Link to="/faq">FAQs</Link><Link to="/orders">Order tracking</Link><Link to="/privacy">Privacy policy</Link><Link to="/terms">Terms of service</Link></FooterColumn>
      <div className="footer-social"><h3>Stay in touch</h3><p>Questions, book suggestions, or just a hello—we’d love to hear from you.</p><Link to="/contact"><Mail size={16} /> Get in touch</Link><Link to="/about"><Users size={16} /> Reader community</Link></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} PageTurner Books</span><span>Made for readers, wherever you are.</span></div>
  </footer>;
}
