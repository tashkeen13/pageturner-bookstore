import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import BookCover from '../components/BookCover';

export default function CartPage() {
  const { items, totalPrice, updateQuantity, remove } = useCart();

  if (!items.length) return <main className="page-shell"><div className="empty-state"><span className="eyebrow">YOUR BAG</span><h1>A little room for a story.</h1><p>Your bag is empty for now. There’s a whole shelf waiting.</p><Link className="button button-dark" to="/books">Browse books</Link></div></main>;

  return <main className="page-shell"><div className="page-heading"><span className="eyebrow">YOUR BAG</span><h1>Good picks.</h1><p>{items.length} {items.length === 1 ? 'book' : 'books'} ready for their next home.</p></div><div className="cart-layout"><div className="cart-items">{items.map(book => {
    const bookId = book._id || book.id;
    const stock = Number.isInteger(book.stock) ? book.stock : Number.MAX_SAFE_INTEGER;
    return <article className="cart-item" key={bookId}><BookCover book={book} className="cart-book-cover" /><div className="cart-item-info"><Link to={`/books/${bookId}`}>{book.title}</Link><p>by {book.author}</p><strong>${Number(book.price).toFixed(2)}</strong><div className="quantity-control"><button aria-label={`Decrease ${book.title} quantity`} onClick={() => updateQuantity(bookId, book.quantity - 1)}>−</button><span>{book.quantity}</span><button aria-label={`Increase ${book.title} quantity`} disabled={book.quantity >= stock} onClick={() => updateQuantity(bookId, book.quantity + 1)}>+</button><button className="remove-link" onClick={() => remove(bookId)}>Remove</button></div></div></article>;
  })}</div><aside className="cart-summary"><h2>Order summary</h2><p><span>Subtotal</span><strong>${totalPrice.toFixed(2)}</strong></p><p><span>Shipping</span><span>Calculated at checkout</span></p><div><span>Total</span><strong>${totalPrice.toFixed(2)}</strong></div><p className="muted">Shipping and payment are completed securely at checkout.</p><Link className="button button-dark button-wide" to="/checkout">Continue to checkout</Link></aside></div></main>;
}
