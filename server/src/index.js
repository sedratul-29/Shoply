require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const csrfGuard = require('./middleware/csrf');
const { notFound, errorHandler } = require('./middleware/error');

const isProd = process.env.NODE_ENV === 'production';

// Fail fast on unsafe configuration
if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}

const app = express();

app.disable('x-powered-by');
if (isProd) app.set('trust proxy', 1); // needed for correct client IPs behind a proxy / load balancer

/* ----------------------------- Security layers ---------------------------- */
app.use(helmet()); // secure HTTP headers
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);
app.use(express.json({ limit: '10kb' })); // small body limit blocks oversized payloads
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ and . keys -> blocks NoSQL operator injection
app.use(hpp()); // blocks HTTP parameter pollution
if (!isProd) app.use(morgan('dev'));

// General rate limit for the whole API
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many requests, please slow down' },
  })
);

// Much stricter limit on login / register to slow down password guessing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api', csrfGuard);

// Connect to MongoDB once and reuse the connection. Needed for serverless hosts
// (e.g. Vercel) where the app is exported and never calls start(); harmless elsewhere.
let dbPromise = null;
function ensureDB() {
  if (!dbPromise) {
    dbPromise = connectDB().catch((err) => {
      dbPromise = null; // allow a retry on the next request
      throw err;
    });
  }
  return dbPromise;
}
app.use('/api', (_req, _res, next) => {
  ensureDB().then(() => next(), next);
});

/* --------------------------------- Routes --------------------------------- */
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));

app.use(notFound);
app.use(errorHandler);

/* --------------------------------- Startup -------------------------------- */
async function start() {
  await ensureDB();
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`API running on http://localhost:${port}`));
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
}

module.exports = app;
