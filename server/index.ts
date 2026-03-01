import bcrypt from "bcryptjs";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { eq } from "drizzle-orm";
import express, { Express, NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Stripe from "stripe";

import { db, pool } from "./db/index";
import { users } from "./db/schema";

const app: Express = express();
const PORT = Number(process.env.PORT) || 3000;

/* ================= IMPORTANT FOR RAILWAY / PROXIES ================= */
/**
 * Railway seteaza X-Forwarded-For. Daca nu setezi trust proxy,
 * express-rate-limit poate arunca ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
 */
app.set("trust proxy", 1);

/* ================= ENV VALIDATION ================= */

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET missing");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL missing");
  process.exit(1);
}

/* ================= CONFIG ================= */

const JWT_SECRET = process.env.JWT_SECRET as string;

// Stripe: nu crapa daca lipseste cheia (doar dezactiveaza billing)
const STRIPE_SECRET_KEY = (process.env.STRIPE_SECRET_KEY || "").trim();
const stripe =
  STRIPE_SECRET_KEY && STRIPE_SECRET_KEY.startsWith("sk_")
    ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
    : null;
console.log(
  `[Stripe env] mode=${process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ? "test" : "live"} ` +
  `key=${process.env.STRIPE_SECRET_KEY ? "set" : "missing"} ` +
  `price=${process.env.STRIPE_PRICE_ID ? "set" : "missing"} ` +
  `webhook=${process.env.STRIPE_WEBHOOK_SECRET ? "set" : "missing"}`
);

/**
 * DIAGNOSTIC Stripe env (fara sa expunem cheia completa)
 * - confirma daca rulezi in test/live
 * - confirma daca STRIPE_PRICE_ID / STRIPE_WEBHOOK_SECRET sunt setate
 */
const stripeMode =
  STRIPE_SECRET_KEY.startsWith("sk_live_")
    ? "live"
    : STRIPE_SECRET_KEY.startsWith("sk_test_")
      ? "test"
      : stripe
        ? "unknown"
        : "missing";

const stripeKeyLast4 = STRIPE_SECRET_KEY ? STRIPE_SECRET_KEY.slice(-4) : "----";
console.log(
  `[Stripe env] mode=${stripeMode} key=****${stripeKeyLast4} price=${process.env.STRIPE_PRICE_ID ? "set" : "missing"} webhook=${process.env.STRIPE_WEBHOOK_SECRET ? "set" : "missing"}`,
);

if (!stripe) {
  console.warn("⚠️ STRIPE_SECRET_KEY missing/invalid -> billing disabled");
}

/* ================= SECURITY MIDDLEWARE ================= */

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Try again later." },
});

app.use("/auth", authLimiter);

/* ================= TYPES ================= */

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

/* ================= AUTH MIDDLEWARE ================= */

const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

/* ================= HEALTH ================= */

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "OK" });
  } catch (e) {
    console.error("Health DB error:", e);
    res.status(500).json({ status: "DB_ERROR" });
  }
});

/* ================= DEBUG (PROTECTED) ================= */

app.get("/debug/db-status", verifyToken, async (_req, res) => {
  try {
    const dbName = await pool.query("SELECT current_database() AS name");
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      ) AS exists
    `);

    let counts = { users: 0 };
    if (tableCheck.rows[0]?.exists === true) {
      const userCount = await pool.query("SELECT COUNT(*) AS count FROM users");
      counts.users = parseInt(userCount.rows[0]?.count ?? "0", 10);
    }

    res.json({
      connected: true,
      database: dbName.rows[0]?.name ?? "unknown",
      tables: { users_exists: tableCheck.rows[0]?.exists === true },
      counts,
    });
  } catch (e) {
    console.error("db-status error:", e);
    res.status(500).json({ connected: false, error: "DB_STATUS_ERROR" });
  }
});

/* ================= AUTH ================= */

app.post("/auth/signup", async (req: Request, res: Response) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    const password = (req.body?.password || "").trim();
    const name = (req.body?.name || "").trim();

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password too short" });
    }

    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 12);

    await db.insert(users).values({
      id: `user_${Date.now()}`,
      email,
      name,
      password_hash: hash,
      email_verified: false,
      interests: "[]",
    });

    return res.status(201).json({ message: "User created" });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    const password = (req.body?.password || "").trim();

    if (!email || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    const rows = await db.select().from(users).where(eq(users.email, email));
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash || "");
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* ================= BILLING (OPTIONAL) ================= */

app.post("/billing/create-checkout-session", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: "Billing disabled: STRIPE_SECRET_KEY missing/invalid" });
    }

    const priceId = (process.env.STRIPE_PRICE_ID || "").trim();
    if (!priceId || !priceId.startsWith("price_")) {
      return res.status(500).json({ error: "STRIPE_PRICE_ID missing/invalid" });
    }

    const APP_URL = (process.env.APP_URL || "").trim() || `http://localhost:${PORT}`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/cancel`,
      metadata: { userId: req.user?.id || "" },
    });

    return res.json({ url: session.url });
  } catch (e) {
    console.error("Checkout error:", e);
    return res.status(500).json({ error: "Unable to create checkout session" });
  }
});

/* ================= START ================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Return API running on port ${PORT}`);
});