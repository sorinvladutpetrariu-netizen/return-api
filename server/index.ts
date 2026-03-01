import bcrypt from 'bcryptjs';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { eq } from 'drizzle-orm';
import express, { Express, NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

import { db, pool } from './db/index';
import { users } from './db/schema';

const app: Express = express();
const PORT = Number(process.env.PORT) || 3000;

/* ================= ENV VALIDATION ================= */

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL missing');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET missing');
  process.exit(1);
}

/* ================= CONFIG ================= */

const JWT_SECRET = process.env.JWT_SECRET as string;

// IMPORTANT for Railway / any proxy (fix express-rate-limit crash)
app.set('trust proxy', 1);

// Stripe optional (do NOT crash server if missing)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

if (!STRIPE_SECRET_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY missing (billing endpoints will be disabled)');
}

/* ================= SECURITY MIDDLEWARE ================= */

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json({ limit: '1mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests. Try again later.' },
});

app.use('/auth', authLimiter);

/* ================= AUTH MIDDLEWARE ================= */

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/* ================= HEALTH ================= */

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK' });
  } catch (e) {
    console.error('Health DB error:', e);
    res.status(500).json({ status: 'DB_ERROR' });
  }
});

/* ================= DEBUG (PROTECTED) ================= */

app.get('/debug/db-status', verifyToken, async (_req: AuthRequest, res: Response) => {
  try {
    // 1) connection + db name
    const dbNameResult = await pool.query('SELECT current_database() AS name');
    const database = dbNameResult.rows[0]?.name ?? 'unknown';

    // 2) check key tables exist
    const existsUsers = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      ) AS exists`,
    );

    // 3) basic counts (only if users exists)
    let counts = { users: 0 };
    if (existsUsers.rows[0]?.exists === true) {
      const userCount = await pool.query('SELECT COUNT(*)::int AS count FROM users');
      counts.users = userCount.rows[0]?.count ?? 0;
    }

    res.json({
      connected: true,
      database,
      tables: { users_exists: existsUsers.rows[0]?.exists === true },
      counts,
    });
  } catch (err) {
    console.error('db-status error:', err);
    res.status(500).json({ connected: false, error: 'DB_STATUS_FAILED' });
  }
});

/* ================= AUTH ================= */

app.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = (req.body?.password || '').trim();
    const name = (req.body?.name || '').trim();

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password too short' });
    }

    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hash = await bcrypt.hash(password, 12);

    await db.insert(users).values({
      id: `user_${Date.now()}`,
      email,
      name,
      password_hash: hash,
      email_verified: false,
      interests: '[]',
    });

    return res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = (req.body?.password || '').trim();

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const rows = await db.select().from(users).where(eq(users.email, email));
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    const valid = await bcrypt.compare(password, user.password_hash || '');
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ================= START ================= */

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Return API running on port ${PORT}`);
});