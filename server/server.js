import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { ApiError } from './middleware/errorMiddleware.js';
import { connectDB } from './config/db.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import userRoutes from './routes/userRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import { getUploadsDirectory } from './config/uploads.js';

const app = express();
const port = Number(process.env.PORT) || 5000;
const isProduction = process.env.NODE_ENV === 'production';

function getAllowedOrigins() {
  const developmentOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  const configuredOrigins = process.env.CORS_ORIGIN
    ?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  if (!configuredOrigins?.length) {
    if (isProduction) throw new Error('CORS_ORIGIN must list the deployed frontend origin in production.');
    return developmentOrigins;
  }

  const parsedOrigins = configuredOrigins.map(origin => {
    let parsedOrigin;
    try {
      parsedOrigin = new URL(origin);
    } catch {
      throw new Error('CORS_ORIGIN must contain comma-separated valid origin URLs.');
    }
    if (!['http:', 'https:'].includes(parsedOrigin.protocol) ||
        parsedOrigin.origin !== origin.replace(/\/$/, '')) {
      throw new Error('CORS_ORIGIN entries must be origins only (scheme and host, no paths).');
    }
    return parsedOrigin.origin;
  });
  return [...new Set([...parsedOrigins, ...(isProduction ? [] : developmentOrigins)])];
}

const allowedOrigins = getAllowedOrigins();
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many sign-in attempts. Please wait and try again.' }
});
const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many cover uploads. Please wait and try again.' }
});
const contactRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many contact messages. Please try again later.' }
});

app.disable('x-powered-by');
if (isProduction) app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new ApiError(403, 'This origin is not allowed by the API CORS policy.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600
}));
app.use(express.json({ limit: '10kb' }));
app.use(morgan(':method :status :response-time ms'));
app.use('/api', apiRateLimit);
app.use('/uploads', express.static(getUploadsDirectory(), {
  dotfiles: 'deny',
  index: false,
  fallthrough: true,
  maxAge: '30d',
  // Covers are public assets requested by the frontend on a different local
  // development port (and by a separately hosted storefront in production).
  // Helmet's default same-origin policy otherwise makes browsers reject them.
  setHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'PageTurner API is running.' });
});
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/contact', contactRateLimit, contactRoutes);
app.use('/api/admin/upload-cover', uploadRateLimit);
app.use('/api/admin', adminRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/books', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

app.use(notFound);
app.use(errorHandler);

async function startServer() {
  if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, 'utf8') < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes. Generate a random secret and set it in the environment.');
  }

  await connectDB(process.env.MONGO_URI);
  app.listen(port, () => {
    console.info('PageTurner API started.');
  });
}

startServer().catch(error => {
  console.error('PageTurner API failed to start:', error.name || 'Error');
  process.exitCode = 1;
});
