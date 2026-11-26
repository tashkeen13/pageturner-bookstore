import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const CartContext = createContext(null);
const STORAGE_KEY = 'pageturner-cart';

function readCart() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter(item => {
      const bookId = getBookId(item);
      return item && typeof item === 'object' && typeof bookId === 'string' && bookId &&
        !bookId.startsWith('demo') &&
        Number.isFinite(item.price) && item.price >= 0 &&
        Number.isInteger(item.quantity) && item.quantity > 0;
    }).map(item => ({
      ...item,
      quantity: Math.min(item.quantity, Number.isInteger(item.stock) ? Math.max(0, item.stock) : 99, 99)
    })).filter(item => item.quantity > 0);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function getBookId(book) {
  return book?._id || book?.id;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    let active = true;
    const realItems = items.filter(item => !String(getBookId(item)).startsWith('demo'));
    if (!realItems.length) return () => { active = false; };
    Promise.all(realItems.map(item => api.get(`/books/${getBookId(item)}`).then(response => ({ id: getBookId(item), book: response.data.book })).catch(error => ({ id: getBookId(item), error }))))
      .then(results => {
        if (!active) return;
        const updated = new Map(results.filter(result => result.book).map(result => [result.id, result.book]));
        const missing = new Set(results.filter(result => result.error?.response?.status === 404).map(result => result.id));
        setItems(current => current.flatMap(item => {
          const id = getBookId(item);
          if (missing.has(id)) return [];
          const latest = updated.get(id);
          if (!latest) return [item];
          const quantity = Math.min(item.quantity, latest.stock, 99);
          return quantity > 0 ? [{ ...item, ...latest, quantity }] : [];
        }));
        if (missing.size) toast.error('A book that was removed from the catalog has been taken out of your bag.');
        if (results.some(result => result.book && (result.book.stock < (items.find(item => getBookId(item) === result.id)?.quantity || 0) || result.book.price !== items.find(item => getBookId(item) === result.id)?.price))) {
          toast('Your bag was refreshed with current prices and stock.');
        }
      });
    return () => { active = false; };
    // Reconcile the persisted cart once when the app starts. Later changes use add/updateQuantity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = useCallback((book, quantity = 1) => {
    const bookId = getBookId(book);
    if (!bookId || !Number.isInteger(quantity) || quantity < 1) return false;
    const maximum = Math.min(Number.isInteger(book.stock) ? Math.max(0, book.stock) : 99, 99);
    const existing = items.find(item => getBookId(item) === bookId);
    if (maximum < 1 || (existing?.quantity || 0) >= maximum) return false;

    setItems(current => {
      const existing = current.find(item => getBookId(item) === bookId);
      if (existing) {
        return current.map(item => getBookId(item) === bookId
          ? { ...item, quantity: Math.min(maximum, item.quantity + quantity) }
          : item);
      }
      return [...current, { ...book, quantity: Math.min(maximum, quantity) }];
    });
    return true;
  }, [items]);

  const remove = useCallback(bookId => {
    setItems(current => current.filter(item => getBookId(item) !== bookId));
  }, []);

  const updateQuantity = useCallback((bookId, quantity) => {
    if (!Number.isInteger(quantity)) return;
    if (quantity <= 0) {
      remove(bookId);
      return;
    }
    const currentBook = items.find(item => getBookId(item) === bookId);
    if (Number.isInteger(currentBook?.stock) && currentBook.stock < 1) {
      remove(bookId);
      return;
    }
    setItems(current => current.map(item => getBookId(item) === bookId
      ? { ...item, quantity: Math.min(quantity, Number.isInteger(item.stock) ? Math.max(0, item.stock) : 99, 99) }
      : item));
  }, [items, remove]);

  const clear = useCallback(() => setItems([]), []);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0);

  const value = useMemo(() => ({
    items, itemCount, totalPrice, add, remove, updateQuantity, clear
  }), [items, itemCount, totalPrice, add, remove, updateQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
