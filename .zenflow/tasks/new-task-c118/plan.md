# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

If you are blocked and need user clarification, mark the current step with `[!]` in plan.md before stopping.

---

## Workflow Steps

### [x] Step: Technical Specification
<!-- chat-id: d686fcdc-1fc6-4019-a1f8-de1c0978835e -->

Assess the task's difficulty, as underestimating it leads to poor outcomes.
- easy: Straightforward implementation, trivial bug fix or feature
- medium: Moderate complexity, some edge cases or caveats to consider
- hard: Complex logic, many caveats, architectural considerations, or high-risk changes

Create a technical specification for the task that is appropriate for the complexity level:
- Review the existing codebase architecture and identify reusable components.
- Define the implementation approach based on established patterns in the project.
- Identify all source code files that will be created or modified.
- Define any necessary data model, API, or interface changes.
- Describe verification steps using the project's test and lint commands.

Save the output to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach
- Source code structure changes
- Data model / API / interface changes
- Verification approach

If the task is complex enough, create a detailed implementation plan based on `{@artifacts_path}/spec.md`:
- Break down the work into concrete tasks (incrementable, testable milestones)
- Each task should reference relevant contracts and include verification steps
- Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function).

Important: unit tests must be part of each implementation task, not separate tasks. Each task should implement the code and its tests together, if relevant.

Save to `{@artifacts_path}/plan.md`. If the feature is trivial and doesn't warrant this breakdown, keep the Implementation step below as is.

---

### [x] Step: Fix Stripe webhook ordering and wire requestId middleware
<!-- chat-id: 4de15252-2591-4cba-bac3-253cc2699b2a -->

In `server/index.ts`:
- Move `POST /webhooks/stripe` route registration to BEFORE `app.use(express.json())`
- Import `requestIdMiddleware` and `RequestWithId` from `./middleware/requestId`
- Register `app.use(requestIdMiddleware)` as the first middleware (before `cors` and `express.json`)
- Extend `AuthRequest` to also extend `RequestWithId`
- In catch blocks for DB-heavy routes (signup, login, recommendations), log `req.requestId` alongside the error

Verify: `npm run lint` passes; Stripe webhook route appears before `express.json()` in code.

---

### [x] Step: Add validation layer to signup and interests endpoints
<!-- chat-id: 6a5ba01b-9004-49a7-9c93-2f59c9a892f4 -->

In `server/index.ts`:
- `POST /auth/signup`: add `password.length >= 8` check (return 400 with message `'Password must be at least 8 characters'`)
- `POST /auth/signup`: validate each interest in the submitted array against `ALL_INTERESTS` (case-insensitive match); return 400 with message `'Invalid interest category: <name>'` on first invalid
- `POST /auth/interests`: same interests validation

Verify: `npm run lint` passes; manual test with short password returns 400; invalid interest returns 400.

---

### [x] Step: Fix recommendations fallback and limit
<!-- chat-id: 2022ad26-7691-49bf-a083-3f88582e95a0 -->

In `server/index.ts`, update `GET /recommendations`:
- After filtering by interests, if result is empty → fall back to top 5 of all content
- Change slice limit from 10 → 5 for both books and articles

Verify: endpoint returns 5 books + 5 articles when interests match nothing.

---

### [x] Step: Add debug DB-status endpoint and export pool
<!-- chat-id: bd8faab5-736b-4b56-b38b-a2baf92ecfcd -->

In `server/db/index.ts`:
- Export `pool` (the `pg.Pool` instance)

In `server/index.ts`:
- Import `pool` from `./db/index`
- Add `GET /debug/db-status` protected by `verifyToken`
- Use `pool.query()` to run:
  - `SELECT current_database() AS name`
  - `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users') AS exists`
  - `SELECT COUNT(*) FROM users`, `SELECT COUNT(*) FROM books`, `SELECT COUNT(*) FROM articles`, `SELECT COUNT(*) FROM quotes`
- Return `{ connected, database, tables: { users_exists }, counts: { users, books, articles, quotes } }`
- No secrets or credentials in response

Verify: `GET /debug/db-status` without token → 401; with valid token → 200 with shape above.

---

### [x] Step: Create seed script and add npm script
<!-- chat-id: 8d752d97-949f-4e51-b151-eabf5506a2a3 -->

Create `server/seed.ts`:
- Import `db` from `./db/index`
- Insert 5 books (categories: Mindset, Discipline, Wellness, Leadership, Philosophy)
- Insert 5 articles (categories: Growth, Psychology, Meditation, Resilience, Habits)
- Insert 7 quotes (varied categories; one with `date_scheduled` = today's date in `YYYY-MM-DD`)
- Use `.onConflictDoNothing()` on each insert for idempotency

In `package.json`:
- Add `"seed": "tsx server/seed.ts"` to `scripts`

Verify: `npm run seed` completes without error; running it twice produces no errors and no duplicate rows.

---

### [x] Step: Final lint, typecheck, and report
<!-- chat-id: a71f4d78-7146-4017-ad4d-b7d28a54ca03 -->

- Run `npm run lint`
- Run `npx tsc --noEmit`
- Fix any type errors or lint warnings
- Write `{@artifacts_path}/report.md` describing what was implemented, how it was tested, and any challenges
