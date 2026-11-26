import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
app.use(express.json());
const db = await open({ filename: './store.sqlite', driver: sqlite3.Database });

await db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
    price INTEGER NOT NULL, color TEXT NOT NULL, image TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT, customer TEXT NOT NULL,
    items TEXT NOT NULL, total INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);
const count = await db.get('SELECT COUNT(*) AS count FROM products');
if (!count.count) {
  const products = [
    [1,'The Everyday Tote','Accessories',89,'Sand','https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85'],
    [2,'Cloud Cotton Shirt','Clothing',64,'Ivory','https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=85'],
    [3,'Form Runner','Footwear',118,'Stone','https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85'],
    [4,'Minimal Timepiece','Accessories',149,'Silver','https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85'],
    [5,'Relaxed Denim','Clothing',98,'Indigo','https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=85'],
    [6,'Studio Headphones','Accessories',179,'Graphite','https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85']
  ];
  await db.exec('BEGIN');
  for (const p of products) await db.run('INSERT INTO products VALUES (?, ?, ?, ?, ?, ?)', p);
  await db.exec('COMMIT');
}

app.get('/api/products', async (_req, res) => res.json(await db.all('SELECT * FROM products')));
app.post('/api/orders', async (req, res) => {
  const { customer, items, total } = req.body;
  if (!customer?.name || !customer?.email || !Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Invalid order' });
  const result = await db.run('INSERT INTO orders (customer, items, total) VALUES (?, ?, ?)', JSON.stringify(customer), JSON.stringify(items), Number(total) || 0);
  res.status(201).json({ id: result.lastID });
});
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(3005, () => console.log('Velora API running at http://localhost:3005'));
