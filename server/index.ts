import bcrypt from 'bcryptjs';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { eq } from 'drizzle-orm';
import express, { Express, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

import { db, pool } from './db/index';
import { users, subscriptions, books } from './db/schema';

const app: Express = express();
const PORT = Number(process.env.PORT) || 3000;

/* ================= ENV VALIDATION ================= */

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL missing");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET missing");
  process.exit(1);
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn("⚠️ STRIPE_WEBHOOK_SECRET missing");
}

/* ================= CONFIG ================= */

const JWT_SECRET = process.env.JWT_SECRET as string;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/* ================= SECURITY ================= */

app.use(helmet());

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Too many requests. Try again later." },
});

app.use('/auth', authLimiter);

/* ================= AUTH MIDDLEWARE ================= */

function requireAuth(req: any, res: any, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

async function requireActiveSubscription(req: any, res: any, next: NextFunction) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.user_id, userId));

  if (sub.length === 0 || sub[0].status !== "active") {
    return res.status(403).json({ error: "Active subscription required" });
  }

  next();
}

/* ================= HEALTH ================= */

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK' });
  } catch {
    res.status(500).json({ status: 'DB_ERROR' });
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
    console.error("Signup error:", err);
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

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ token });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ================= BILLING ================= */

app.post('/billing/create-checkout-session', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!, // ID din Stripe Dashboard
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL}/success`,
      cancel_url: `${process.env.APP_URL}/cancel`,
      metadata: {
        userId: userId,
      },
    });

    return res.json({ url: session.url });

  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ error: "Unable to create checkout session" });
  }
});

/* ================= PREMIUM ROUTE EXAMPLE ================= */

app.get('/books', requireAuth, requireActiveSubscription, async (_req, res) => {
  try {
    const allBooks = await db.select().from(books);
    res.json({ books: allBooks });
  } catch (err) {
    console.error("Books error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ================= STRIPE WEBHOOK ================= */

app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return res.status(400).send('Webhook Error');
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const subscription = event.data.object as any;

    await db.insert(subscriptions).values({
      user_id: subscription.metadata.userId,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      plan: subscription.items.data[0].price.id,
    }).onConflictDoUpdate({
      target: subscriptions.user_id,
      set: {
        status: subscription.status,
        stripe_subscription_id: subscription.id
      }
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as any;

    await db.update(subscriptions)
      .set({ status: "canceled" })
      .where(eq(subscriptions.stripe_subscription_id, subscription.id));
  }

  res.json({ received: true });
});

/* ================= START ================= */

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Production server running on port ${PORT}`);
});