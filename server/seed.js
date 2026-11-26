import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import Book from './models/Book.js';

// These are published novels. Cover images are resolved from each book's ISBN.
const novels = [
  ['Pride and Prejudice', 'Jane Austen', 'Romance', 'A spirited young woman and a reserved gentleman challenge their first impressions in this classic story of family, manners, and love.', 9.99, '9780141439518', 432, 'Penguin Classics', 4.8, 18420],
  ['Jane Eyre', 'Charlotte Brontë', 'Literary Fiction', 'An independent governess finds love and purpose while confronting the secrets of Thornfield Hall.', 10.99, '9780141441146', 624, 'Penguin Classics', 4.7, 12600],
  ['Frankenstein', 'Mary Shelley', 'Science Fiction', 'Victor Frankenstein creates life, then faces the consequences of abandoning the being he brought into the world.', 8.99, '9780141439471', 280, 'Penguin Classics', 4.5, 9300],
  ['Dracula', 'Bram Stoker', 'Fantasy', 'A group of friends chronicles the arrival of Count Dracula and their effort to stop his growing influence.', 9.99, '9780141439846', 488, 'Penguin Classics', 4.5, 8700],
  ['Little Women', 'Louisa May Alcott', 'Literary Fiction', 'The four March sisters grow up, pursue their ambitions, and support one another through changing fortunes.', 11.99, '9780147514011', 816, 'Puffin Classics', 4.7, 14200],
  ['The Great Gatsby', 'F. Scott Fitzgerald', 'Literary Fiction', 'Nick Carraway observes the dazzling parties and private longing surrounding his neighbor Jay Gatsby.', 8.99, '9780743273565', 180, 'Scribner', 4.4, 16100],
  ['The Hobbit', 'J. R. R. Tolkien', 'Fantasy', 'Bilbo Baggins leaves his comfortable home for a journey with a band of dwarves and the wizard Gandalf.', 14.99, '9780547928227', 320, 'Mariner Books', 4.8, 24500],
  ['The Fellowship of the Ring', 'J. R. R. Tolkien', 'Fantasy', 'Frodo begins a perilous journey to destroy a powerful ring before its maker can reclaim it.', 15.99, '9780547928210', 576, 'Mariner Books', 4.8, 21300],
  ['Dune', 'Frank Herbert', 'Science Fiction', 'On the desert planet Arrakis, Paul Atreides becomes central to a struggle over power, prophecy, and the valuable spice.', 13.99, '9780441172719', 688, 'Ace Books', 4.7, 19700],
  ['1984', 'George Orwell', 'Science Fiction', 'Winston Smith tries to preserve his private thoughts in a society ruled by surveillance and the Party.', 9.99, '9780451524935', 328, 'Signet Classics', 4.6, 22100],
  ['The Handmaid’s Tale', 'Margaret Atwood', 'Science Fiction', 'Offred recounts life under Gilead, a regime that has stripped women of rights and freedom.', 12.99, '9780385490818', 311, 'Anchor Books', 4.5, 15300],
  ['The Martian', 'Andy Weir', 'Science Fiction', 'Stranded alone on Mars, astronaut Mark Watney uses ingenuity and science to survive until rescue might come.', 14.99, '9780553418026', 387, 'Broadway Books', 4.7, 17600],
  ['The Book Thief', 'Markus Zusak', 'Historical Fiction', 'In Nazi Germany, young Liesel finds refuge in books and small acts of courage during a devastating war.', 12.99, '9780375842207', 584, 'Knopf Books for Young Readers', 4.7, 20800],
  ['The Kite Runner', 'Khaled Hosseini', 'Literary Fiction', 'Amir looks back on friendship, betrayal, and the possibility of making amends in Afghanistan and beyond.', 12.99, '9781594631931', 400, 'Riverhead Books', 4.6, 18300],
  ['The Night Circus', 'Erin Morgenstern', 'Fantasy', 'Two young illusionists are bound to a mysterious competition staged inside a traveling black-and-white circus.', 13.99, '9780307744432', 512, 'Anchor Books', 4.5, 13700],
  ['The Song of Achilles', 'Madeline Miller', 'Fantasy', 'Patroclus tells the story of his bond with Achilles, from their youth to the Trojan War.', 13.99, '9780062060624', 416, 'Ecco', 4.6, 16200],
  ['Circe', 'Madeline Miller', 'Fantasy', 'The daughter of Helios discovers her own power and finds a place in a world of gods, mortals, and monsters.', 14.99, '9780316556347', 400, 'Little, Brown and Company', 4.6, 14900],
  ['The Silent Patient', 'Alex Michaelides', 'Mystery', 'A psychotherapist becomes fixated on a famous patient who has not spoken since a violent crime.', 14.99, '9781250301697', 336, 'Celadon Books', 4.4, 21400],
  ['And Then There Were None', 'Agatha Christie', 'Mystery', 'Ten strangers arrive on an island, where a recorded accusation is followed by a series of deaths.', 9.99, '9780062073488', 272, 'William Morrow', 4.6, 19500],
  ['Murder on the Orient Express', 'Agatha Christie', 'Mystery', 'Hercule Poirot investigates a murder aboard a snowbound train, where every passenger has a story.', 9.99, '9780062693662', 288, 'William Morrow', 4.5, 15800],
  ['The Thursday Murder Club', 'Richard Osman', 'Mystery', 'Four retirement-village friends meet to investigate old cases, then find themselves facing a new one.', 16.99, '9781984880987', 368, 'Pamela Dorman Books', 4.3, 7800],
  ['The Midnight Library', 'Matt Haig', 'Fantasy', 'Between life and death, Nora explores alternate lives and considers what makes a life worth living.', 15.99, '9780525559474', 304, 'Viking', 4.2, 11200],
  ['A Man Called Ove', 'Fredrik Backman', 'Literary Fiction', 'A strict, grieving neighbor finds his routines disrupted by the lively family who moves in next door.', 14.99, '9781476738024', 368, 'Atria Books', 4.5, 12400],
  ['The Alchemist', 'Paulo Coelho', 'Fantasy', 'A young shepherd travels from Spain toward Egypt in search of treasure and a deeper understanding of his journey.', 10.99, '9780062315007', 208, 'HarperOne', 4.4, 22100],
  ['The Seven Husbands of Evelyn Hugo', 'Taylor Jenkins Reid', 'Romance', 'A reclusive Hollywood star tells a young journalist the complicated story behind her seven marriages.', 16.99, '9781501161933', 400, 'Atria Books', 4.6, 13700],
  ['Where the Crawdads Sing', 'Delia Owens', 'Mystery', 'A young woman raised in the marsh becomes the focus of a small-town investigation after a local man dies.', 15.99, '9780735219090', 384, 'G. P. Putnam’s Sons', 4.5, 17900],
  ['The House in the Cerulean Sea', 'TJ Klune', 'Fantasy', 'A cautious case worker visits a remote home for magical children and begins to question his rules.', 15.99, '9781250217288', 400, 'Tor Books', 4.6, 9100],
  ['Project Hail Mary', 'Andy Weir', 'Science Fiction', 'An astronaut wakes alone aboard a spacecraft and must solve a scientific crisis threatening the Sun.', 18.99, '9780593135204', 496, 'Ballantine Books', 4.8, 14600],
  ['The Vanishing Half', 'Brit Bennett', 'Literary Fiction', 'Twin sisters choose very different lives, shaping the next generation in ways neither could predict.', 16.99, '9780525536291', 352, 'Riverhead Books', 4.4, 8300],
  ['Normal People', 'Sally Rooney', 'Romance', 'Connell and Marianne move between friendship and love as they grow from schoolmates into adulthood.', 14.99, '9781984822178', 288, 'Hogarth', 4.1, 9600],
  ['Jannat Kay Pattay', 'Nimra Ahmed', 'Urdu Fiction', 'Haya Suleman’s journey moves between family, faith, identity, and a suspenseful mystery across Pakistan and Turkey.', 22.99, 'B0DLT6XP41', 544, 'Ilm-o-Irfan Publishers', 4.7, 5742],
  ['Jo Bachay Hain Sang Samait Lo', 'Farhat Ishtiaq', 'Urdu Fiction', 'Two people carrying painful pasts find the possibility of trust, healing, and a new beginning.', 21.99, '9789695173220', 478, 'Ali Mian Publications', 4.6, 3200]
];

const books = novels.map(([
  title, author, genre, description, price, isbn, pages, publisher, averageRating, numReviews
]) => ({
  title,
  author,
  genre,
  description,
  price,
  stock: 12 + (Number(isbn.slice(-2)) % 19),
  language: genre === 'Urdu Fiction' ? 'Urdu' : 'English',
  publisher,
  isbn,
  pages,
  coverImage: isbn === 'B0DLT6XP41'
    ? 'https://www.ilmoirfanpublisher.com/cdn/shop/files/image-fotor-2026110242330.png?v=1793622223&width=800'
    : isbn === '9789695173220'
      ? 'https://www.azeembooks.com/cdn/shop/files/JoBachayHainSangSamaitLo_ByFarhatIshtiaq.webp?v=1730100687&width=800'
      : `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
  averageRating,
  numReviews
}));

async function seedBooks() {
  await connectDB(process.env.MONGO_URI);

  // Remove only the invented sample entries from the previous seed script.
  const removed = await Book.deleteMany({ isbn: /^978-1-55501-/ });
  const operations = books.map(book => ({
    updateOne: {
      filter: { isbn: book.isbn },
      update: { $set: book },
      upsert: true
    }
  }));
  const result = await Book.bulkWrite(operations);
  console.log(`Seed complete: ${result.upsertedCount} novels added, ${result.modifiedCount} updated, ${removed.deletedCount} old demo books removed.`);
}

seedBooks()
  .catch(error => {
    console.error('Could not seed novels:', error.name || 'Error');
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
