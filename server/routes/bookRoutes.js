import { Router } from 'express';
import {
  createBook,
  deleteBook,
  getBook,
  listGenres,
  listBooks,
  updateBook
} from '../controllers/bookController.js';
import { adminOnly, protect } from '../middleware/authMiddleware.js';
import { validateBookBody } from '../middleware/validateBook.js';

const router = Router();

router.get('/genres', listGenres);

router.route('/')
  .get(listBooks)
  .post(protect, adminOnly, validateBookBody, createBook);

router.route('/:id')
  .get(getBook)
  .put(protect, adminOnly, validateBookBody, updateBook)
  .delete(protect, adminOnly, deleteBook);

export default router;
