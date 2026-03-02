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

/* ================= IMPORTANT FOR RAILWAY ================= */

app.set("trust proxy", 1);

/* ================= ENV VALIDATION ================= */

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET missing");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

/* ================= CONFIG ================= */

const JWT_SECRET = process.env.JWT_SECRET as string;

const STRIPE_SECRET_KEY = (process.env.STRIPE_SECRET_KEY || "").trim();

const stripe =
  STRIPE_SECRET_KEY && STRIPE_SECRET_KEY.startsWith("sk_")
    ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
    : null;

const stripeMode =
  STRIPE_SECRET_KEY.startsWith("sk_live_")
    ? "live"
    : STRIPE_SECRET_KEY.startsWith("sk_test_")
    ? "test"
    : "missing";

console.log(
  `[Stripe env] mode=${stripeMode} price=${
    process.env.STRIPE_PRICE_ID ? "set" : "missing"
  } webhook=${process.env.STRIPE_WEBHOOK_SECRET ? "set" : "missing"}`
);

/* ================= SECURITY ================= */

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

/* ================= STRIPE WEBHOOK ================= */

app.post(
  "/billing/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    try {
      if (!stripe) return res.status(503).send("billing disabled");

      const secret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
      if (!secret) return res.status(500).send("missing STRIPE_WEBHOOK_SECRET");

      const sig = req.headers["stripe-signature"];
      if (!sig || typeof sig !== "string")
        return res.status(400).send("missing signature");

      const event = stripe.webhooks.constructEvent(req.body, sig, secret);

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;

          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id;

          const userId = (session.metadata?.userId || "").trim();

          if (customerId && userId) {
            await db
              .update(users)
              .set({ stripe_customer_id: customerId })
              .where(eq(users.id, userId));
          }
          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;

          const customerId =
            typeof invoice.customer === "string"
              ? invoice.customer
              : invoice.customer?.id;

          if (customerId) {
            await db
              .update(users)
              .set({ is_premium: true })
              .where(eq(users.stripe_customer_id, customerId));
          }
          break;
        }

        case "invoice.payment_failed":
        case "customer.subscription.deleted": {
          const obj: any = event.data.object;

          const customerId =
            typeof obj.customer === "string"
              ? obj.customer
              : obj.customer?.id;

          if (customerId) {
            await db
              .update(users)
              .set({ is_premium: false })
              .where(eq(users.stripe_customer_id, customerId));
          }
          break;
        }

        default:
          break;
      }

      console.log("[stripe webhook]", event.type);
      return res.json({ received: true });
    } catch (err: any) {
      console.error("Webhook error:", err?.message || err);
      return res.status(400).send("Webhook error");
    }
  }
);

/* ================= BODY PARSER ================= */

app.use(express.json({ limit: "1mb" }));

/* ================= RATE LIMIT ================= */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
});

app.use("/auth", authLimiter);

/* ================= TYPES ================= */

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

/* ================= AUTH MIDDLEWARE ================= */

const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token)
    return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
    };
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
  } catch {
    res.status(500).json({ status: "DB_ERROR" });
  }
});

/* ================= AUTH ================= */

app.post("/auth/signup", async (req: Request, res: Response) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    const password = (req.body?.password || "").trim();
    const name = (req.body?.name || "").trim();

    if (!email || !password || !name)
      return res.status(400).json({ error: "Missing fields" });

    if (password.length < 8)
      return res.status(400).json({ error: "Password too short" });

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existing.length > 0)
      return res.status(409).json({ error: "User exists" });

    const hash = await bcrypt.hash(password, 12);

    await db.insert(users).values({
      id: `user_${Date.now()}`,
      email,
      name,
      password_hash: hash,
      email_verified: false,
      interests: "[]",
      is_premium: false,
      stripe_customer_id: null,
    });

    return res.status(201).json({ message: "User created" });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

app.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    const password = (req.body?.password || "").trim();

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = rows[0];

    const valid = await bcrypt.compare(password, user.password_hash || "");

    if (!valid)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

/* ================= BILLING ================= */

app.post(
  "/billing/create-checkout-session",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!stripe)
        return res.status(503).json({ error: "Billing disabled" });

      const priceId = (process.env.STRIPE_PRICE_ID || "").trim();

      const APP_URL =
        (process.env.APP_URL || "").trim() ||
        `http://localhost:${PORT}`;

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/cancel`,
        metadata: { userId: req.user?.id || "" },
      });

      return res.json({ url: session.url });
    } catch {
      return res.status(500).json({ error: "Checkout failed" });
    }
  }
);

/* ================= START ================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Return API running on port ${PORT}`);
});