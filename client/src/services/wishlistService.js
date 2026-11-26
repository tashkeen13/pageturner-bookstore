import api from './api';

let owner = '';
let cachedIds = null;
let pending = null;

function currentOwner() {
  try { const user = JSON.parse(localStorage.getItem('pageturner-user') || 'null'); return user?.id || user?._id || ''; }
  catch { return ''; }
}

export async function getWishlistIds() {
  const nextOwner = currentOwner();
  if (owner !== nextOwner) { owner = nextOwner; cachedIds = null; pending = null; }
  if (!nextOwner) return new Set();
  if (cachedIds) return new Set(cachedIds);
  if (!pending) pending = api.get('/users/wishlist').then(response => {
    cachedIds = new Set(response.data.wishlist.map(book => book._id));
    return cachedIds;
  }).finally(() => { pending = null; });
  return new Set(await pending);
}

export async function toggleWishlistBook(bookId) {
  const nextOwner = currentOwner();
  const response = await api.post(`/users/wishlist/${bookId}`);
  if (owner !== nextOwner) { owner = nextOwner; cachedIds = null; }
  if (cachedIds) {
    if (response.data.inWishlist) cachedIds.add(bookId);
    else cachedIds.delete(bookId);
  }
  return response.data;
}
