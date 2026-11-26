import api from './api';
import { getDemoBookById, getDemoBooks, getDemoReviews } from '../data/demoBooks';

function isApiUnavailable(error) {
  return !error.response || error.response.status >= 500;
}

const allowDemoCatalog = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_CATALOG === 'true';

/**
 * Use real API data when available, with sample catalog data for offline demos.
 * Client errors are not hidden by the fallback.
 */
export async function fetchBooks(params) {
  let response;
  try {
    response = await api.get('/books', { params, timeout: 60000 });
  } catch (error) {
    if (!allowDemoCatalog || !isApiUnavailable(error)) throw error;
    return { ...getDemoBooks(params), isDemo: true };
  }

  if (!Array.isArray(response.data?.books)) {
    throw new Error('The books service returned an unexpected response. Please check the API configuration.');
  }
  if (String(params?.genre || '').toLowerCase() === 'urdu fiction' && response.data.books.length === 0) {
    return { ...getDemoBooks(params), isDemo: true };
  }
  return { ...response.data, isDemo: false };
}

export async function fetchGenres() {
  try {
    const response = await api.get('/books/genres', { timeout: 60000 });
    const genres = [...new Set([...response.data.genres, 'Urdu Fiction'])]
      .sort((a, b) => a.localeCompare(b));
    return { genres, isDemo: false };
  } catch (error) {
    if (!allowDemoCatalog || !isApiUnavailable(error)) throw error;
    const genres = [...new Set(getDemoBooks({ limit: 50 }).books.map(book => book.genre))]
      .sort((a, b) => a.localeCompare(b));
    return { genres, isDemo: true };
  }
}

export async function fetchBook(id) {
  const demoBook = getDemoBookById(id);
  if (demoBook) return { book: demoBook, isDemo: true };

  const response = await api.get(`/books/${id}`, { timeout: 60000 });
  return { book: response.data.book, isDemo: false };
}

export async function fetchReviews(id, params = {}) {
  if (getDemoBookById(id)) {
    const reviews = getDemoReviews(id);
    return {
      reviews,
      count: reviews.length,
      pagination: { page: 1, limit: 10, totalReviews: reviews.length, totalPages: reviews.length ? 1 : 0 },
      isDemo: true
    };
  }

  const response = await api.get(`/books/${id}/reviews`, { params, timeout: 5000 });
  return { ...response.data, isDemo: false };
}
