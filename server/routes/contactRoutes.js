import { Router } from 'express';
import { createContactMessage } from '../controllers/contactController.js';
import { validateContact } from '../middleware/validateContact.js';

const router = Router();
router.post('/', validateContact, createContactMessage);

export default router;
