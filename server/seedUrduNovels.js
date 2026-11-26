import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import Book from './models/Book.js';

const books = [
  {
    title: 'Jannat Kay Pattay',
    author: 'Nimra Ahmed',
    genre: 'Urdu Fiction',
    description: 'Haya Suleman’s journey moves between family, faith, identity, and a suspenseful mystery across Pakistan and Turkey.',
    price: 22.99,
    stock: 12,
    language: 'Urdu',
    publisher: 'Ilm-o-Irfan Publishers',
    isbn: 'B0DLT6XP41',
    pages: 544,
    coverImage: 'https://www.ilmoirfanpublisher.com/cdn/shop/files/image-fotor-2026110242330.png?v=1793622223&width=800',
    averageRating: 4.7,
    numReviews: 5742
  },
  {
    title: 'Jo Bachay Hain Sang Samait Lo',
    author: 'Farhat Ishtiaq',
    genre: 'Urdu Fiction',
    description: 'Two people carrying painful pasts find the possibility of trust, healing, and a new beginning.',
    price: 21.99,
    stock: 12,
    language: 'Urdu',
    publisher: 'Ali Mian Publications',
    isbn: '9789695173220',
    pages: 478,
    coverImage: 'https://www.azeembooks.com/cdn/shop/files/JoBachayHainSangSamaitLo_ByFarhatIshtiaq.webp?v=1730100687&width=800',
    averageRating: 4.6,
    numReviews: 3200
  }
];

try {
  await connectDB(process.env.MONGO_URI);
  const result = await Book.bulkWrite(books.map(book => ({
    updateOne: { filter: { isbn: book.isbn }, update: { $set: book }, upsert: true }
  })));
  console.log(`Urdu novels synced: ${result.upsertedCount} added, ${result.modifiedCount} updated.`);
} catch (error) {
  console.error('Could not sync Urdu novels:', error.name || 'Error');
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
