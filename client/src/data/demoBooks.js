// Real novels used as a clearly labeled local preview when the API is offline.
// Cover images are looked up by ISBN from Open Library.
const novelData = [
  ['Pride and Prejudice', 'Jane Austen', 'Romance', 'A spirited young woman and a reserved gentleman challenge their first impressions in this classic story of family, manners, and love.', 9.99, '9780141439518', 432, 4.8, 18420],
  ['Jane Eyre', 'Charlotte Brontë', 'Literary Fiction', 'An independent governess finds love and purpose while confronting the secrets of Thornfield Hall.', 10.99, '9780141441146', 624, 4.7, 12600],
  ['Frankenstein', 'Mary Shelley', 'Science Fiction', 'Victor Frankenstein creates life, then faces the consequences of abandoning the being he brought into the world.', 8.99, '9780141439471', 280, 4.5, 9300],
  ['Dracula', 'Bram Stoker', 'Fantasy', 'A group of friends chronicles the arrival of Count Dracula and their effort to stop his growing influence.', 9.99, '9780141439846', 488, 4.5, 8700],
  ['Little Women', 'Louisa May Alcott', 'Literary Fiction', 'The four March sisters grow up, pursue their ambitions, and support one another through changing fortunes.', 11.99, '9780147514011', 816, 4.7, 14200],
  ['The Great Gatsby', 'F. Scott Fitzgerald', 'Literary Fiction', 'Nick Carraway observes the dazzling parties and private longing surrounding his neighbor Jay Gatsby.', 8.99, '9780743273565', 180, 4.4, 16100],
  ['The Hobbit', 'J. R. R. Tolkien', 'Fantasy', 'Bilbo Baggins leaves his comfortable home for a journey with a band of dwarves and the wizard Gandalf.', 14.99, '9780547928227', 320, 4.8, 24500],
  ['The Fellowship of the Ring', 'J. R. R. Tolkien', 'Fantasy', 'Frodo begins a perilous journey to destroy a powerful ring before its maker can reclaim it.', 15.99, '9780547928210', 576, 4.8, 21300],
  ['Dune', 'Frank Herbert', 'Science Fiction', 'On the desert planet Arrakis, Paul Atreides becomes central to a struggle over power, prophecy, and the valuable spice.', 13.99, '9780441172719', 688, 4.7, 19700],
  ['1984', 'George Orwell', 'Science Fiction', 'Winston Smith tries to preserve his private thoughts in a society ruled by surveillance and the Party.', 9.99, '9780451524935', 328, 4.6, 22100],
  ['The Handmaid’s Tale', 'Margaret Atwood', 'Science Fiction', 'Offred recounts life under Gilead, a regime that has stripped women of rights and freedom.', 12.99, '9780385490818', 311, 4.5, 15300],
  ['The Martian', 'Andy Weir', 'Science Fiction', 'Stranded alone on Mars, astronaut Mark Watney uses ingenuity and science to survive until rescue might come.', 14.99, '9780553418026', 387, 4.7, 17600],
  ['The Book Thief', 'Markus Zusak', 'Historical Fiction', 'In Nazi Germany, young Liesel finds refuge in books and small acts of courage during a devastating war.', 12.99, '9780375842207', 584, 4.7, 20800],
  ['The Kite Runner', 'Khaled Hosseini', 'Literary Fiction', 'Amir looks back on friendship, betrayal, and the possibility of making amends in Afghanistan and beyond.', 12.99, '9781594631931', 400, 4.6, 18300],
  ['The Night Circus', 'Erin Morgenstern', 'Fantasy', 'Two young illusionists are bound to a mysterious competition staged inside a traveling black-and-white circus.', 13.99, '9780307744432', 512, 4.5, 13700],
  ['The Song of Achilles', 'Madeline Miller', 'Fantasy', 'Patroclus tells the story of his bond with Achilles, from their youth to the Trojan War.', 13.99, '9780062060624', 416, 4.6, 16200],
  ['Circe', 'Madeline Miller', 'Fantasy', 'The daughter of Helios discovers her own power and finds a place in a world of gods, mortals, and monsters.', 14.99, '9780316556347', 400, 4.6, 14900],
  ['The Silent Patient', 'Alex Michaelides', 'Mystery', 'A psychotherapist becomes fixated on a famous patient who has not spoken since a violent crime.', 14.99, '9781250301697', 336, 4.4, 21400],
  ['And Then There Were None', 'Agatha Christie', 'Mystery', 'Ten strangers arrive on an island, where a recorded accusation is followed by a series of deaths.', 9.99, '9780062073488', 272, 4.6, 19500],
  ['Murder on the Orient Express', 'Agatha Christie', 'Mystery', 'Hercule Poirot investigates a murder aboard a snowbound train, where every passenger has a story.', 9.99, '9780062693662', 288, 4.5, 15800],
  ['The Thursday Murder Club', 'Richard Osman', 'Mystery', 'Four retirement-village friends meet to investigate old cases, then find themselves facing a new one.', 16.99, '9781984880987', 368, 4.3, 7800],
  ['The Midnight Library', 'Matt Haig', 'Fantasy', 'Between life and death, Nora explores alternate lives and considers what makes a life worth living.', 15.99, '9780525559474', 304, 4.2, 11200],
  ['A Man Called Ove', 'Fredrik Backman', 'Literary Fiction', 'A strict, grieving neighbor finds his routines disrupted by the lively family who moves in next door.', 14.99, '9781476738024', 368, 4.5, 12400],
  ['The Alchemist', 'Paulo Coelho', 'Fantasy', 'A young shepherd travels from Spain toward Egypt in search of treasure and a deeper understanding of his journey.', 10.99, '9780062315007', 208, 4.4, 22100],
  ['The Seven Husbands of Evelyn Hugo', 'Taylor Jenkins Reid', 'Romance', 'A reclusive Hollywood star tells a young journalist the complicated story behind her seven marriages.', 16.99, '9781501161933', 400, 4.6, 13700],
  ['Where the Crawdads Sing', 'Delia Owens', 'Mystery', 'A young woman raised in the marsh becomes the focus of a small-town investigation after a local man dies.', 15.99, '9780735219090', 384, 4.5, 17900],
  ['The House in the Cerulean Sea', 'TJ Klune', 'Fantasy', 'A cautious case worker visits a remote home for magical children and begins to question his rules.', 15.99, '9781250217288', 400, 4.6, 9100],
  ['Project Hail Mary', 'Andy Weir', 'Science Fiction', 'An astronaut wakes alone aboard a spacecraft and must solve a scientific crisis threatening the Sun.', 18.99, '9780593135204', 496, 4.8, 14600],
  ['The Vanishing Half', 'Brit Bennett', 'Literary Fiction', 'Twin sisters choose very different lives, shaping the next generation in ways neither could predict.', 16.99, '9780525536291', 352, 4.4, 8300],
  ['Normal People', 'Sally Rooney', 'Romance', 'Connell and Marianne move between friendship and love as they grow from schoolmates into adulthood.', 14.99, '9781984822178', 288, 4.1, 9600],
  ['Jannat Kay Pattay', 'Nimra Ahmed', 'Urdu Fiction', 'Haya Suleman’s journey moves between family, faith, identity, and a suspenseful mystery across Pakistan and Turkey.', 22.99, 'B0DLT6XP41', 544, 4.7, 5742],
  ['Jo Bachay Hain Sang Samait Lo', 'Farhat Ishtiaq', 'Urdu Fiction', 'Two people carrying painful pasts find the possibility of trust, healing, and a new beginning.', 21.99, '9789695173220', 478, 4.6, 3200]
];

const publishersByIsbn = {
  '9780141439518': 'Penguin Classics',
  '9780141441146': 'Penguin Classics',
  '9780141439471': 'Penguin Classics',
  '9780141439846': 'Penguin Classics',
  '9780147514011': 'Puffin Classics',
  '9780743273565': 'Scribner',
  '9780547928227': 'Mariner Books',
  '9780547928210': 'Mariner Books',
  '9780441172719': 'Ace Books',
  '9780451524935': 'Signet Classics',
  '9780385490818': 'Anchor Books',
  '9780553418026': 'Broadway Books',
  '9780375842207': 'Knopf Books for Young Readers',
  '9781594631931': 'Riverhead Books',
  '9780307744432': 'Anchor Books',
  '9780062060624': 'Ecco',
  '9780316556347': 'Little, Brown and Company',
  '9781250301697': 'Celadon Books',
  '9780062073488': 'William Morrow',
  '9780062693662': 'William Morrow',
  '9781984880987': 'Pamela Dorman Books',
  '9780525559474': 'Viking',
  '9781476738024': 'Atria Books',
  '9780062315007': 'HarperOne',
  '9781501161933': 'Atria Books',
  '9780735219090': 'G. P. Putnam’s Sons',
  '9781250217288': 'Tor Books',
  '9780593135204': 'Ballantine Books',
  '9780525536291': 'Riverhead Books',
  '9781984822178': 'Hogarth',
  B0DLT6XP41: 'Ilm-o-Irfan Publishers',
  '9789695173220': 'Ali Mian Publications'
};

export const demoBooks = novelData.map((book, index) => {
  const [title, author, genre, description, price, isbn, pages, averageRating, numReviews] = book;
  return {
    _id: `demo000000000000000000${String(index + 1).padStart(2, '0')}`,
    title,
    author,
    genre,
    description,
    price,
    stock: 12 + (index % 19),
    language: genre === 'Urdu Fiction' ? 'Urdu' : 'English',
    publisher: publishersByIsbn[isbn] || 'Various publishers',
    isbn,
    pages,
    coverImage: isbn === 'B0DLT6XP41'
      ? 'https://www.ilmoirfanpublisher.com/cdn/shop/files/image-fotor-2026110242330.png?v=1793622223&width=800'
      : isbn === '9789695173220'
        ? 'https://www.azeembooks.com/cdn/shop/files/JoBachayHainSangSamaitLo_ByFarhatIshtiaq.webp?v=1730100687&width=800'
        : `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
    averageRating,
    numReviews
  };
});

export function getDemoBooks(params = {}) {
  const search = String(params.search || '').trim().toLowerCase();
  const genre = String(params.genre || '').trim().toLowerCase();
  const minPrice = params.minPrice === undefined ? undefined : Number(params.minPrice);
  const maxPrice = params.maxPrice === undefined ? undefined : Number(params.maxPrice);
  const minRating = params.minRating === undefined ? undefined : Number(params.minRating);
  const rawSort = params.sort || 'newest';
  const sort = ({
    'low-to-high': 'price_asc',
    low_to_high: 'price_asc',
    price_low_to_high: 'price_asc',
    'high-to-low': 'price_desc',
    high_to_low: 'price_desc',
    price_high_to_low: 'price_desc'
  })[rawSort] || rawSort;
  const page = Math.max(1, Number.parseInt(params.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(params.limit, 10) || 12));

  const matchingBooks = demoBooks.filter(book =>
    (!search || `${book.title} ${book.author}`.toLowerCase().includes(search)) &&
    (!genre || book.genre.toLowerCase() === genre) &&
    (minPrice === undefined || !Number.isFinite(minPrice) || book.price >= minPrice) &&
    (maxPrice === undefined || !Number.isFinite(maxPrice) || book.price <= maxPrice) &&
    (minRating === undefined || !Number.isFinite(minRating) || book.averageRating >= minRating)
  );

  if (sort === 'price_asc') matchingBooks.sort((a, b) => a.price - b.price || a.title.localeCompare(b.title));
  if (sort === 'price_desc') matchingBooks.sort((a, b) => b.price - a.price || a.title.localeCompare(b.title));
  if (sort === 'rating_desc') matchingBooks.sort((a, b) => b.averageRating - a.averageRating);
  if (sort === 'title_asc') {
    matchingBooks.sort((a, b) =>
      a.title.localeCompare(b.title, 'en', { sensitivity: 'base', numeric: true }) ||
      a._id.localeCompare(b._id)
    );
  }

  const totalBooks = matchingBooks.length;
  const books = matchingBooks.slice((page - 1) * limit, page * limit);
  return {
    success: true,
    count: books.length,
    pagination: { page, limit, totalBooks, totalPages: Math.ceil(totalBooks / limit) },
    books
  };
}

export function getDemoBookById(id) {
  return demoBooks.find(book => book._id === id) || null;
}

export function getDemoReviews(bookId) {
  const book = getDemoBookById(bookId);
  if (!book || book.numReviews < 1) return [];
  return [{
    _id: `review-${bookId}`,
    rating: Math.round(book.averageRating),
    comment: 'A reader favorite, with a story that has stayed with people across generations.',
    user: { name: 'PageTurner reader' },
    createdAt: '2026-01-15T12:00:00.000Z'
  }];
}
