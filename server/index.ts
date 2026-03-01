import bcrypt from 'bcryptjs';
import cors from 'cors';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import express, { Express, NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

import { db, pool } from './db/index';
import { articles, books, purchases, quotes, users } from './db/schema';
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from './gmail-service';
import { requestIdMiddleware, getRequestId } from './middleware/requestId';

const app: Express = express();
const PORT = Number(process.env.PORT) || 3000;

// -------------------- ENV VALIDATION --------------------
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL missing");
}

if (!process.env.JWT_SECRET) {
  console.warn("⚠️ JWT_SECRET missing, using fallback (NOT SAFE FOR PROD)");
}

// -------------------- Config --------------------
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

// -------------------- Middleware --------------------
app.use(cors());
app.use(express.json());
app.use(requestIdMiddleware);

// -------------------- Health --------------------
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'DB_ERROR', error: (err as any)?.message });
  }
});

// -------------------- SIGNUP (SAFE VERSION) --------------------
app.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = (req.body?.password || '').trim();
    const name = (req.body?.name || '').trim();

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const userId = `user_${Date.now()}`;

    await db.insert(users).values({
      id: userId,
      email,
      name,
      password_hash: hash,
      email_verified: false,
      verification_token: verificationToken,
      verification_token_expires: new Date(Date.now() + 86400000),
      interests: '[]',
    });

    // Gmail optional – nu mai poate provoca 500
    if (process.env.GMAIL_USER && process.env.GMAIL_PASSWORD) {
      try {
        await sendVerificationEmail(email, name, verificationToken, APP_URL);
      } catch (e) {
        console.error("Email send failed (non-blocking):", e);
      }
    }

    return res.status(201).json({
      message: 'User created successfully',
      user: { id: userId, email, name }
    });

  } catch (error: any) {
    console.error("SIGNUP ERROR:", error);
    return res.status(500).json({
      error: error?.message || "Internal server error",
      stack: error?.stack
    });
  }
});

// -------------------- LOGIN --------------------
app.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = (req.body?.password || '').trim();

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
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

    return res.json({
      message: 'Login successful',
      token
    });

  } catch (error: any) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      error: error?.message,
      stack: error?.stack
    });
  }
});

// -------------------- START --------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});