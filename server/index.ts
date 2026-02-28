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
const port = Number(process.env.PORT || 3000);

// -------------------- Config --------------------
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  ...(process.env.STRIPE_API_VERSION ? { apiVersion: process.env.STRIPE_API_VERSION as any } : {}),
});

const APP_URL = process.env.APP_URL || `http://localhost:${port}`;

// Gmail diagnostics
if (process.env.GMAIL_USER && process.env.GMAIL_PASSWORD) {
  console.log('✅ Gmail configured - Email service enabled');
} else {
  console.warn('⚠️  Gmail not configured. Email features disabled.');
}

// -------------------- Stripe Webhook (MUST be BEFORE express.json()) --------------------
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  try {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    if (!webhookSecret) {
      console.warn('Webhook secret not configured');
      return res.json({ received: true });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error: any) {
      console.error(`[${reqId}] Webhook signature verification failed:`, error.message);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log(`[${reqId}] ✅ Payment succeeded:`, (event.data.object as any).id);
        break;
      case 'payment_intent.payment_failed':
        console.log(`[${reqId}] ❌ Payment failed:`, (event.data.object as any).id);
        break;
      case 'charge.refunded':
        console.log(`[${reqId}] 💰 Charge refunded:`, (event.data.object as any).id);
        break;
      default:
        console.log(`[${reqId}] Unhandled event type:`, event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`[${reqId}] Webhook error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------- Global Middleware --------------------
app.use(cors());
app.use(express.json());
app.use(requestIdMiddleware);

// -------------------- Types --------------------
interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

// -------------------- Auth middleware --------------------
const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// -------------------- Helpers --------------------

// Interests are stored as TEXT (JSON string) in DB
function parseInterests(interestsText: any): string[] {
  if (!interestsText) return [];
  if (Array.isArray(interestsText)) return interestsText;
  if (typeof interestsText !== 'string') return [];
  try {
    const parsed = JSON.parse(interestsText);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeJsonStringifyArray(value: any): string {
  const arr = Array.isArray(value) ? value.filter((x) => typeof x === 'string') : [];
  return JSON.stringify(arr);
}

function normalizeText(x: any): string {
  return typeof x === 'string' ? x.trim() : '';
}

// All interests (shared list)
const ALL_INTERESTS = [
  'Mindset',
  'Consciousness',
  'Discipline',
  'Growth',
  'Spiritual Development',
  'Psychology',
  'Self-Improvement',
  'Meditation',
  'Philosophy',
  'Wellness',
  'Motivation',
  'Leadership',
  'Relationships',
  'Habits',
  'Resilience',
  'Authenticity',
  'Intuition',
];

// -------------------- Interests --------------------
app.get('/interests', (_req: Request, res: Response) => {
  res.json({ interests: ALL_INTERESTS });
});

// -------------------- Auth --------------------

// SIGNUP
app.post('/auth/signup', async (req: Request, res: Response) => {
  const reqId = getRequestId(req);
  try {
    const email = normalizeText(req.body?.email).toLowerCase();
    const password = normalizeText(req.body?.password);
    const name = normalizeText(req.body?.name);
    const rawInterests: string[] = Array.isArray(req.body?.interests) ? req.body.interests : [];

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    for (const interest of rawInterests) {
      if (typeof interest !== 'string' || !ALL_INTERESTS.some((v) => v.toLowerCase() === interest.toLowerCase())) {
        return res.status(400).json({ error: `Invalid interest category: ${interest}` });
      }
    }

    const interestsText = safeJsonStringifyArray(rawInterests);
    const interestsArr = parseInterests(interestsText);

    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const userId = `user_${Date.now()}`;

    await db.insert(users).values({
      id: userId,
      email,
      name,
      password_hash,
      email_verified: false,
      verification_token: verificationToken,
      verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      interests: interestsText as any,
    });

    try {
      await sendVerificationEmail(email, name, verificationToken, APP_URL);
      console.log(`[${reqId}] 📧 Verification email sent to ${email}`);
    } catch (emailError) {
      console.error(`[${reqId}] Error sending verification email:`, emailError);
    }

    res.status(201).json({
      message: 'User created successfully. Please check your email to verify your account.',
      user: { id: userId, email, name, email_verified: false, interests: interestsArr },
    });
  } catch (error) {
    console.error(`[${reqId}] Signup error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// LOGIN
app.post('/auth/login', async (req: Request, res: Response) => {
  const reqId = getRequestId(req);
  try {
    const email = normalizeText(req.body?.email).toLowerCase();
    const password = normalizeText(req.body?.password);

    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

    const userRows = await db.select().from(users).where(eq(users.email, email));
    if (userRows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    if (!userRows[0].email_verified) {
      return res.status(403).json({
        error: 'Email not verified. Please check your email for verification link.',
        email_verified: false,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, userRows[0].password_hash || '');
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: userRows[0].id, email: userRows[0].email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      user: {
        id: userRows[0].id,
        email: userRows[0].email,
        name: userRows[0].name,
        interests: parseInterests((userRows[0] as any).interests),
      },
      token,
    });
  } catch (error) {
    console.error(`[${reqId}] Login error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ME
app.get('/auth/me', verifyToken, async (req: AuthRequest, res: Response) => {
  const reqId = getRequestId(req);
  try {
    const userRows = await db.select().from(users).where(eq(users.id, req.user?.id || ''));
    if (userRows.length === 0) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: {
        id: userRows[0].id,
        email: userRows[0].email,
        name: userRows[0].name,
        interests: parseInterests((userRows[0] as any).interests),
      },
    });
  } catch (error) {
    console.error(`[${reqId}] Get user error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE INTERESTS
app.post('/auth/interests', verifyToken, async (req: AuthRequest, res: Response) => {
  const reqId = getRequestId(req);
  try {
    const rawInterests: string[] = Array.isArray(req.body?.interests) ? req.body.interests : [];

    for (const interest of rawInterests) {
      if (typeof interest !== 'string' || !ALL_INTERESTS.some((v) => v.toLowerCase() === interest.toLowerCase())) {
        return res.status(400).json({ error: `Invalid interest category: ${interest}` });
      }
    }

    const interestsText = safeJsonStringifyArray(rawInterests);
    const interestsArr = parseInterests(interestsText);

    await db
      .update(users)
      .set({ interests: interestsText as any })
      .where(eq(users.id, req.user?.id || ''));

    res.json({ success: true, interests: interestsArr });
  } catch (error) {
    console.error(`[${reqId}] Update interests error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// VERIFY EMAIL (POST) – used by mobile
app.post('/auth/verify-email', async (req: Request, res: Response) => {
  const reqId = getRequestId(req);
  try {
    const token = normalizeText(req.body?.token);
    if (!token) return res.status(400).json({ error: 'Verification token required' });

    const userRows = await db.select().from(users).where(eq(users.verification_token, token));

    if (
      userRows.length === 0 ||
      !userRows[0].verification_token_expires ||
      userRows[0].verification_token_expires < new Date()
    ) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    await db
      .update(users)
      .set({
        email_verified: true,
        verification_token: null as any,
        verification_token_expires: null as any,
      })
      .where(eq(users.id, userRows[0].id));

    try {
      await sendWelcomeEmail(userRows[0].email, userRows[0].name);
      console.log(`[${reqId}] 📧 Welcome email sent to ${userRows[0].email}`);
    } catch (emailError) {
      console.error(`[${reqId}] Error sending welcome email:`, emailError);
    }

    const jwtToken = jwt.sign({ id: userRows[0].id, email: userRows[0].email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Email verified successfully',
      user: { id: userRows[0].id, email: userRows[0].email, name: userRows[0].name, email_verified: true },
      token: jwtToken,
    });
  } catch (error) {
    console.error(`[${reqId}] Email verification error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// FORGOT PASSWORD
app.post('/auth/forgot-password', async (req: Request, res: Response) => {
  const reqId = getRequestId(req);
  try {
    const email = normalizeText(req.body?.email).toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email required' });

    const userRows = await db.select().from(users).where(eq(users.email, email));

    if (userRows.length > 0) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      await db
        .update(users)
        .set({
          reset_token: resetToken as any,
          reset_token_expires: new Date(Date.now() + 60 * 60 * 1000),
        })
        .where(eq(users.id, userRows[0].id));

      try {
        await sendPasswordResetEmail(email, userRows[0].name, resetToken, APP_URL);
        console.log(`[${reqId}] 📧 Password reset email sent to ${email}`);
      } catch (emailError) {
        console.error(`[${reqId}] Error sending password reset email:`, emailError);
      }
    }

    res.json({ message: 'If email exists, password reset link has been sent' });
  } catch (error) {
    console.error(`[${reqId}] Forgot password error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------- Content --------------------

// ARTICLES
app.get('/articles', async (req: Request, res: Response) => {
  const reqId = getRequestId(req);
  try {
    const allArticles = await db.select().from(articles);
    res.json({ articles: allArticles });
  } catch (error) {
    console.error(`[${reqId}] Get articles error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// BOOKS
app.get('/books', async (req: Request, res: Response) => {
  const reqId = getRequestId(req);
  try {
    const allBooks = await db.select().from(books);
    res.json({ books: allBooks });
  } catch (error) {
    console.error(`[${reqId}] Get books error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// RECOMMENDATIONS (interest-based with fallback)
app.get('/recommendations', verifyToken, async (req: AuthRequest, res: Response) => {
  const reqId = getRequestId(req);
  try {
    const userId = req.user?.id || '';
    const userRows = await db.select().from(users).where(eq(users.id, userId));
    if (userRows.length === 0) return res.status(404).json({ error: 'User not found' });

    const interests = parseInterests((userRows[0] as any).interests);

    const allBooks = await db.select().from(books);
    const allArticles = await db.select().from(articles);

    const matchCategory = (category?: string) =>
      !!category && interests.some((i) => category.toLowerCase().includes(i.toLowerCase()));

    let recommendedBooks: typeof allBooks;
    let recommendedArticles: typeof allArticles;

    if (interests.length === 0) {
      recommendedBooks = allBooks.slice(0, 5);
      recommendedArticles = allArticles.slice(0, 5);
    } else {
      const matchedBooks = allBooks.filter((b: any) => matchCategory(b.category));
      const matchedArticles = allArticles.filter((a: any) => matchCategory(a.category));

      recommendedBooks = matchedBooks.length > 0 ? matchedBooks.slice(0, 5) : allBooks.slice(0, 5);
      recommendedArticles = matchedArticles.length > 0 ? matchedArticles.slice(0, 5) : allArticles.slice(0, 5);
    }

    res.json({
      userInterests: interests,
      recommendations: {
        books: recommendedBooks,
        articles: recommendedArticles,
      },
    });
  } catch (error) {
    console.error(`[${reqId}] Recommendations error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------- Debug --------------------

// DB status endpoint (protected)
app.get('/debug/db-status', verifyToken, async (req: AuthRequest, res: Response) => {
  const reqId = getRequestId(req);
  try {
    let connected = false;
    let databaseName = 'unknown';

    try {
      const dbNameResult = await pool.query('SELECT current_database() AS name');
      databaseName = dbNameResult.rows[0]?.name ?? 'unknown';
      connected = true;
    } catch (dbError) {
      console.error(`[${reqId}] DB connection check failed:`, dbError);
    }

    let usersTableExists = false;
    try {
      const tableCheck = await pool.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'users'
        ) AS exists`,
      );
      usersTableExists = tableCheck.rows[0]?.exists === true;
    } catch {
      usersTableExists = false;
    }

    let counts = { users: 0, books: 0, articles: 0, quotes: 0 };

    if (connected) {
      try {
        const [userCount, bookCount, articleCount, quoteCount] = await Promise.all([
          pool.query('SELECT COUNT(*) AS count FROM users'),
          pool.query('SELECT COUNT(*) AS count FROM books'),
          pool.query('SELECT COUNT(*) AS count FROM articles'),
          pool.query('SELECT COUNT(*) AS count FROM quotes'),
        ]);
        counts = {
          users: parseInt(userCount.rows[0]?.count ?? '0', 10),
          books: parseInt(bookCount.rows[0]?.count ?? '0', 10),
          articles: parseInt(articleCount.rows[0]?.count ?? '0', 10),
          quotes: parseInt(quoteCount.rows[0]?.count ?? '0', 10),
        };
      } catch (countError) {
        console.error(`[${reqId}] DB count error:`, countError);
      }
    }

    res.json({
      connected,
      database: databaseName,
      tables: { users_exists: usersTableExists },
      counts,
    });
  } catch (error) {
    console.error(`[${reqId}] Debug db-status error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------- Payments (Stripe) --------------------

app.post('/payments/create-intent', verifyToken, async (req: AuthRequest, res: Response) => {
  const reqId = getRequestId(req);
  try {
    const amount = req.body?.amount;
    const article_id = req.body?.article_id;
    const book_id = req.body?.book_id;
    const description = normalizeText(req.body?.description);

    if (!amount || (!article_id && !book_id)) {
      return res.status(400).json({ error: 'Amount and item ID required' });
    }

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      description: description || 'Return Purchase',
      metadata: {
        userId: req.user?.id ?? '',
        articleId: article_id,
        bookId: book_id,
      },
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status,
    });
  } catch (error: any) {
    console.error(`[${getRequestId(req)}] Create payment intent error:`, error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/payments/confirm', verifyToken, async (req: AuthRequest, res: Response) => {
  const reqId = getRequestId(req);
  try {
    const paymentIntentId = normalizeText(req.body?.paymentIntentId);
    const article_id = req.body?.article_id;
    const book_id = req.body?.book_id;
    const amount = req.body?.amount;

    if (!paymentIntentId || (!article_id && !book_id)) {
      return res.status(400).json({ error: 'Payment intent ID and item ID required' });
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const purchaseId = `purchase_${Date.now()}`;

    await db.insert(purchases).values({
      id: purchaseId,
      user_id: req.user?.id || '',
      article_id,
      book_id,
      amount,
      stripe_payment_id: paymentIntentId,
    });

    res.json({
      message: 'Payment confirmed and purchase recorded',
      purchase: {
        id: purchaseId,
        article_id,
        book_id,
        amount,
        stripe_payment_id: paymentIntentId,
      },
    });
  } catch (error: any) {
    console.error(`[${reqId}] Confirm payment error:`, error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/payments/purchases', verifyToken, async (req: AuthRequest, res: Response) => {
  const reqId = getRequestId(req);
  try {
    const userPurchases = await db.select().from(purchases).where(eq(purchases.user_id, req.user?.id || ''));
    res.json({ purchases: userPurchases });
  } catch (error) {
    console.error(`[${reqId}] Get purchases error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------- Quotes --------------------

// Non-auth: quote scheduled for today
app.get('/quotes/today', async (req: Request, res: Response) => {
  const reqId = getRequestId(req);
  try {
    const today = new Date().toISOString().split('T')[0];
    const quoteRows = await db.select().from(quotes).where(eq(quotes.date_scheduled, today));

    if (quoteRows.length === 0) return res.status(404).json({ error: 'No quote for today' });

    res.json({ quote: quoteRows[0] });
  } catch (error) {
    console.error(`[${reqId}] Get quote error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auth: personalized quote by user interests (fallback to normal quote of today)
app.get('/quotes/today/personalized', verifyToken, async (req: AuthRequest, res: Response) => {
  const reqId = getRequestId(req);
  try {
    const today = new Date().toISOString().split('T')[0];

    const userRows = await db.select().from(users).where(eq(users.id, req.user?.id || ''));
    if (userRows.length === 0) return res.status(404).json({ error: 'User not found' });

    const interests = parseInterests((userRows[0] as any).interests);

    if (interests.length > 0) {
      const todayQuotes = await db.select().from(quotes).where(eq(quotes.date_scheduled, today));
      const match = todayQuotes.find((q: any) =>
        interests.some((i) => ((q.category || '') as string).toLowerCase().includes(i.toLowerCase())),
      );
      if (match) return res.json({ quote: match, personalized: true, interests });
    }

    const fallback = await db.select().from(quotes).where(eq(quotes.date_scheduled, today));
    if (fallback.length === 0) return res.status(404).json({ error: 'No quote for today' });

    res.json({ quote: fallback[0], personalized: false, interests });
  } catch (error) {
    console.error(`[${reqId}] Personalized quote error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/quotes', async (req: Request, res: Response) => {
  const reqId = getRequestId(req);
  try {
    const allQuotes = await db.select().from(quotes);
    res.json({ quotes: allQuotes });
  } catch (error) {
    console.error(`[${reqId}] Get quotes error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------- Health --------------------
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Return API is running' });
});

// -------------------- Start --------------------
app.listen(port, () => {
  console.log(`[server]: Server is running at ${APP_URL}`);
  console.log(`[stripe]: Stripe integration active`);
  console.log(`[email]: Gmail + Nodemailer integration active`);
});
