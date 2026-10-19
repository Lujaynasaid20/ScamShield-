# ScamShield AI

A scam detection and prevention platform built with Next.js (App Router, JavaScript) and PostgreSQL.

Users can analyze suspicious messages, scan links, check phone numbers, emails and sender names against community reports, follow a personalized safety action plan, learn in the Scam Awareness Academy, report scams and track their status, and manage their account security. Administrators review reports and evidence, verify scam patterns, publish alerts, and see platform statistics.

## Quick start

```
npm install
npm run migrate      # creates/updates the database tables
npm run dev          # http://localhost:3000
```

For production: `npm run build`, then `npm start` (set `SESSION_SECRET` first).

## PostgreSQL setup with pgAdmin

1. Open pgAdmin and connect to your local PostgreSQL server.
2. Create a database named `scamshield` (right-click **Databases** > **Create** > **Database**).
3. Copy `.env.example` to `.env.local` and fill in `PGPASSWORD` (and `PGUSER`, host or port if different). Set a long random `SESSION_SECRET`.
4. Run `npm run migrate`. Migrations live in `database/migrations/` and are applied once each, in order; the applied list is stored in the `schema_migrations` table. Running it again is safe.

`.env.local` is ignored by Git. Never put database credentials or API keys in frontend code.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` or `DATABASE_URL` | Yes | Database connection |
| `SESSION_SECRET` | Yes in production | Signs session cookies; also encrypts two-factor secrets unless `TOTP_ENCRYPTION_KEY` is set |
| `TOTP_ENCRYPTION_KEY` | No | Separate key for encrypting two-factor secrets at rest |
| `GOOGLE_SAFE_BROWSING_API_KEY` | No | Enables threat-intelligence lookups in the URL scanner. Only the URL is sent. Without it, the scanner runs heuristics only and says so |

## First admin

Create (or upgrade) an administrator account from the command line:

```
npm run create-admin -- admin@example.com "a-strong-password" "Admin Name"
```

If the email already exists, that account becomes an admin and its password is replaced. Alternatively, register normally and run in pgAdmin: `update public.profiles set role = 'admin' where email = lower('admin@example.com');`

Admins log in through the **Admin** tab and can promote other registered users from **Admin > Users**.

## Project structure

- `app/(user)/` — user pages: overview, analyze, urls, sender, history, reports, protection, academy
- `app/(account)/` — notifications and settings (users and admins)
- `app/admin/` — admin dashboard, report review, scam database, users, trends & alerts
- `app/api/` — route handlers; every protected endpoint checks the session, role and record ownership on the server
- `lib/analyzer.js`, `lib/url-scan.js`, `lib/sender.js` — detection engines (shared by server and browser)
- `lib/recommendations.js` — Safety Action Center steps chosen from each result
- `lib/academy.js` — academy modules and quizzes (quizzes are graded on the server)
- `lib/reputation.js` — optional Google Safe Browsing lookup with graceful fallback
- `lib/server.js` — sessions, authorization, CSRF origin check, rate limiting, error handling
- `database/migrations/` — schema migrations
- `legacy/` — the previous single-page version, kept for reference

## How detection works (and its limits)

- **Messages** are checked by ScamShield's own rule-based engine (English and Kiswahili keywords for urgency, payment requests, requests for codes, prizes, threats, risky links and more). It is not a machine-learning model and messages are **not** sent to any outside AI service. Results include the matched phrases, a confidence level, and stated limitations.
- **URLs** are never opened. The scanner examines only the text of the address (look-alike and brand-imitating domains, IP hosts, `@` tricks, encoding, shorteners, risky endings, downloads). Heuristic findings are shown separately from threat-intelligence results.
- **Sender checks** search community reports. Unverified reports are labelled as allegations; only administrator-verified reports raise the result to the highest level. Reporter identities and report text are never shown to other users.
- No result is a guarantee of safety.

## Security notes

Passwords are hashed with bcrypt (cost 12). Sessions are HTTP-only cookies tied to a server-side session record, so users can see and revoke them; changing the password signs out other sessions. Optional TOTP two-factor authentication stores its secret encrypted (AES-256-GCM). State-changing requests from other origins are rejected. Abuse-prone endpoints are rate-limited (in memory, per server process). Evidence uploads are limited to PNG, JPEG, PDF and plain text (checked by file content, max 2 MB, 5 per report), stored in the database and only served as downloads to the reporter and administrators. Security events are written to `audit_events` without message contents.

## Tests

```
npm run test:unit                       # detection engines, TOTP, academy grading (no server needed)
npm test                                # unit + API integration tests (needs npm run dev running)
node tests/browser-smoke.mjs            # drives Chrome through every page at desktop and phone widths
```

The API and browser tests create throwaway `zz-test-*` / `zz-smoke-*` accounts and delete them afterwards.
