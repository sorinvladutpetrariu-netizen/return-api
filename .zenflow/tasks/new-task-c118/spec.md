# Technical Specification

## Difficulty Assessment

**Hard** — 6 distinct feature areas spanning server middleware, DB introspection, seed data, business logic fixes, input validation, and Stripe integration ordering. Several areas touch the same `server/index.ts` file and require careful coordination to avoid regressions.

---

## Technical Context

| Item | Detail |
|------|--------|
| Runtime | Node.js + TypeScript (strict) |
| Server framework | Express 5 (`express@^5.2.1`) |
| ORM | Drizzle ORM (`drizzle-orm@^0.45.1`) with `drizzle-orm/node-postgres` |
| DB driver | `pg` (Pool-based) |
| DB | PostgreSQL (Railway-hosted) |
| Payments | Stripe (`stripe@^20.4.0`) — Payment Intents + Webhooks |
| Email | Nodemailer + Gmail (`nodemailer@^8.0.1`) |
| Mobile client | Expo Router (React Native) |
| Build | `esbuild` → `dist/index.js`; Dev via `tsx server/index.ts` |
| Env vars | `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_SSL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GMAIL_USER`, `GMAIL_PASSWORD`, `APP_URL` |

### Key files

- **`server/index.ts`** — Single-file Express app (573 lines); all routes, middleware, helpers, and startup
- **`server/db/index.ts`** — Drizzle `db` export + `testConnection()` using `pg.Pool`
- **`server/db/schema.ts`** — Drizzle schema: `users`, `articles`, `books`, `quotes`, `purchases`, plus RETURN v1 tables (`dailyPractices`, `returns`, etc.)
- **`server/middleware/requestId.ts`** — `requestIdMiddleware` already defined but **not wired** into `index.ts`
- **`package.json`** — No `seed` script yet; `devDependencies` has no test framework (no unit tests required per project setup)

---

## Issues Found During Review

1. **Stripe webhook ordering bug** — `app.use(express.json())` is called on line 17, BEFORE the `/webhooks/stripe` route (line 466). Because the webhook uses `express.raw()` inline, it technically won't be double-parsed, but the raw body is lost after `express.json()` has run for other routes. The safest fix is to register the Stripe webhook route **before** `app.use(express.json())`.

2. **`requestId` middleware not wired** — `server/middleware/requestId.ts` exists but is never imported or used in `index.ts`.

3. **No password length validation** — `POST /auth/signup` does not check `password.length >= 8`.

4. **Interests not validated** — `POST /auth/signup` and `POST /auth/interests` accept any string in the interests array without checking against `ALL_INTERESTS`.

5. **Recommendations `fallback` is missing when filter returns empty** — The recommendations endpoint returns an empty array when interests exist but no content matches, rather than falling back to `top 5`.

6. **No seed data** — `books`, `articles`, and `quotes` tables are empty on Railway.

7. **No debug/DB-status endpoint** exists.

---

## Implementation Approach

### Feature 1: Stripe webhook ordering fix

Move the `/webhooks/stripe` route registration to **before** `app.use(express.json())`. This requires restructuring the top of `server/index.ts`:

```
app.use(cors())
// ← Stripe webhook here (uses express.raw inline)
app.use(express.json())
// ← all other routes
```

No schema or API contract changes.

### Feature 2: Wire requestId middleware + improved DB error logging

- Import `requestIdMiddleware` and `RequestWithId` from `./middleware/requestId`
- Register it with `app.use(requestIdMiddleware)` before other middleware
- Extend `AuthRequest` to also extend `RequestWithId`
- In `catch` blocks of DB-sensitive routes, log `requestId` alongside the error for traceability

### Feature 3: Validation layer for signup & interests

In `POST /auth/signup`:
- Check `password.length >= 8`, return 400 if not
- Validate each item in the interests array against `ALL_INTERESTS` (case-insensitive). Reject with 400 if any unknown category is provided.

In `POST /auth/interests`:
- Same interests validation

### Feature 4: Recommendations fallback fix

Current logic returns empty array when interests exist but no content matches. Fix:

```
// books
const filteredBooks = interests.length > 0 ? allBooks.filter(b => match(b.category)) : []
const recommendedBooks = filteredBooks.length > 0 ? filteredBooks.slice(0, 5) : allBooks.slice(0, 5)

// articles
const filteredArticles = interests.length > 0 ? allArticles.filter(a => match(a.category)) : []
const recommendedArticles = filteredArticles.length > 0 ? filteredArticles.slice(0, 5) : allArticles.slice(0, 5)
```

Also reduce the limit from 10 → 5 per the task spec.

### Feature 5: Debug endpoint `GET /debug/db-status`

Protected with `verifyToken`. Uses raw SQL via the `pg` pool (imported from `server/db/index.ts` or directly accessing the pool) to:

1. Check connection (`SELECT current_database()`)
2. Check if `users` table exists via `information_schema.tables`
3. Count rows in `users`, `books`, `articles`, `quotes`

Response shape:
```json
{
  "connected": true,
  "database": "railway",
  "tables": {
    "users_exists": true
  },
  "counts": {
    "users": 3,
    "books": 5,
    "articles": 5,
    "quotes": 7
  }
}
```

No secrets, no credentials in response.

To make the pool accessible, export it from `server/db/index.ts`.

### Feature 6: Seed script `server/seed.ts`

Standalone script run via `tsx server/seed.ts`. Uses the same `db` instance from `server/db/index.ts`.

Content to seed:
- **5 books** across categories: `Mindset`, `Discipline`, `Wellness`, `Leadership`, `Philosophy`
- **5 articles** across categories: `Growth`, `Psychology`, `Meditation`, `Resilience`, `Habits`
- **7 quotes** across varied categories; one with `date_scheduled` = today's ISO date (`YYYY-MM-DD`)

Uses `ON CONFLICT DO NOTHING` semantics via Drizzle's `.onConflictDoNothing()` to make it idempotent.

---

## Source Code Changes

| File | Action | Description |
|------|--------|-------------|
| `server/index.ts` | Modify | Move Stripe webhook before `express.json()`; wire `requestId` middleware; add password + interests validation; fix recommendations fallback + limit; add `/debug/db-status` endpoint |
| `server/db/index.ts` | Modify | Export `pool` for use in the debug endpoint |
| `server/seed.ts` | Create | Idempotent seed script with books, articles, quotes |
| `package.json` | Modify | Add `"seed": "tsx server/seed.ts"` script |
| `server/middleware/requestId.ts` | No change | Already correct; just needs to be wired |

---

## Data Model / API Changes

### New endpoint

**`GET /debug/db-status`** — Protected (Bearer JWT)

Response:
```json
{
  "connected": boolean,
  "database": string,
  "tables": { "users_exists": boolean },
  "counts": { "users": number, "books": number, "articles": number, "quotes": number }
}
```

### Modified endpoint behaviour

**`POST /auth/signup`**
- Now returns `400` if `password.length < 8`
- Now returns `400` if any interest is not in `ALL_INTERESTS`

**`POST /auth/interests`**
- Now returns `400` if any interest is not in `ALL_INTERESTS`

**`GET /recommendations`**
- Fallback to top 5 if interest-filtered result is empty
- Limit changed from 10 → 5

---

## Verification Approach

No test framework is configured. Verification is manual + lint.

1. **Lint**: `npm run lint` (expo eslint)
2. **TypeScript check**: `npx tsc --noEmit`
3. **Manual smoke tests** (locally via `npm run dev`):
   - `POST /auth/signup` with password `abc` → expect 400
   - `POST /auth/signup` with invalid interest → expect 400
   - `GET /recommendations` with interests that match nothing → expect 5 books + 5 articles
   - `GET /debug/db-status` without token → expect 401
   - `GET /debug/db-status` with valid token → expect connected + counts
   - `POST /webhooks/stripe` → verify raw body is not pre-parsed
4. **Seed**: `npm run seed` → should insert data without errors; running twice should be idempotent
