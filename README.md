# ScamShield AI

A scam detection and prevention platform built with Next.js (App Router, JavaScript) and PostgreSQL.

Users can analyze suspicious messages, scan links, check phone numbers, emails and sender names against community reports, follow a personalized safety action plan, learn in the Scam Awareness Academy, report scams and track their status, and manage their account security. Administrators review reports and evidence, verify scam patterns, publish alerts, and see platform statistics.

## Quick start

```
npm install
npm run migrate      # creates/updates the database tables
npm run dev          # http://localhost:3000
```

For production, configure the environment variables below before deploying. Registration writes the account to PostgreSQL and signs the new user in immediately; returning users sign in against the same database.

## Database setup

### Neon (deployed app)

1. In Neon, copy the **pooled** connection string for the database/branch you want to use. It should be a PostgreSQL URL and include SSL mode (`sslmode=require`).
2. In your deployment project's environment variables, set `DATABASE_URL` to that connection string and set `SESSION_SECRET` to a long random secret. Apply both to the Production environment (and Preview if you use preview deployments), then redeploy.
3. Apply the schema once to that same Neon database. For a local terminal, put the Neon URL in `.env.local` as `DATABASE_URL=...`, then run `npm run migrate`. The command is safe to run again; already applied migrations are skipped.
4. Open `https://<your-deployed-domain>/api/health`. A ready setup returns `{"ok":true,"database":"connected","schema":"ready"}`. If it reports missing tables, run the migration against the same Neon URL configured in the deployment.

`DATABASE_URL` and `SESSION_SECRET` are server-only secrets. Do not use `NEXT_PUBLIC_` names for them, commit them, or paste them into frontend code. Keep `SESSION_SECRET` stable after deployment: changing it signs out existing users and can prevent existing two-factor secrets from decrypting.

### Local PostgreSQL with pgAdmin

1. Open pgAdmin and connect to your local PostgreSQL server.
2. Create a database named `scamshield` (right-click **Databases** > **Create** > **Database**).
3. Copy `.env.example` to `.env.local`, leave `DATABASE_URL` empty, uncomment the `PG*` settings and fill in `PGPASSWORD`. Set a long random `SESSION_SECRET`.
4. Run `npm run migrate`. Migrations live in `database/migrations/` and are applied once each, in order; the applied list is stored in the `schema_migrations` table. Running it again is safe.

`.env.local` is ignored by Git. Never put database credentials or API keys in frontend code.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` or `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` | Yes | Database connection. Use the Neon pooled connection string for deployment. |
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

- **Messages** are checked by the existing rule-based engine and an experimental, local TF-IDF / Multinomial Naive Bayes classifier trained on the sample English and Kiswahili messages. Explicit indicators and the rule score remain rule-based; a non-safe model result can raise a low-indicator message to “Suspicious” for review, but the model alone never declares a scam. Model probabilities are not calibrated, and messages are **not** sent to an outside AI service. Users can also upload or paste a screenshot: its text is read in the browser with tesseract.js (English + Swahili), placed in the message box for the user to check, and only that text is analyzed. The image is never uploaded or stored. The OCR engine and language files (several MB, cached by the browser) are downloaded from jsDelivr the first time. Results include matched rule phrases, model evidence, and stated limitations.
- **URLs** are never opened. The scanner examines only the text of the address (look-alike and brand-imitating domains, IP hosts, `@` tricks, encoding, shorteners, risky endings, downloads). Heuristic findings are shown separately from threat-intelligence results.
- **Sender checks** search community reports. Unverified reports are labelled as allegations; only administrator-verified reports raise the result to the highest level. Reporter identities and report text are never shown to other users. The risk level is High (admin-verified reports), Medium (unverified reports), Low (an official business contact with no reports) or Unknown (no reports and no verified identity). Not knowing who owns a number never raises the risk.
  - **Country and line type** come offline from libphonenumber metadata when the number includes its country code.
  - **Carrier / network** needs the optional Twilio Lookup v2 keys (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`; about $0.008 per lookup, cached for 30 days, 30 lookups per user per day). Ported numbers can show their original network.
  - **Verified Business** comes only from the admin-curated directory at *Admin → Verified businesses*, where each official number or email address records where the admin confirmed it. With `TWILIO_LOOKUP_CALLER_NAME=true`, US numbers can also show a carrier-registered business name (about $0.01 per lookup), clearly labelled as not verified by ScamShield. Names of private individuals are discarded and never stored or shown, and caller ID can be spoofed, so even official numbers get a warning.
- No result is a guarantee of safety.

### Training the experimental message model

The training pipeline uses Node.js only; it adds no runtime dependency. Run `npm run train:model` to validate `ScamShield_AI_Sample_Dataset_100.csv`, perform a deterministic 60/20/20 split stratified by label and language, train on the training split, and write the model to `lib/message-model-artifact.js` and metrics/retained dataset annotations to `models/message-model-evaluation.json`. The split seed is recorded in the report. Re-run this command after changing the dataset, then restart/rebuild the app to load the updated artifact.

The evaluation report includes per-class precision, recall, F1 and confusion matrices for validation and test. The 100 fictional examples are too few and too synthetic to support production accuracy claims; the test metrics are descriptive only. `category`, `reason`, and `recommended_action` are retained in the evaluation report, but they do not determine a new message's label or explanation. App categories, explanations, and recommended actions continue to come from matched rules and the existing recommendation engine.

## Security notes

Passwords are hashed with bcrypt (cost 12). Sessions are HTTP-only cookies tied to a server-side session record, so users can see and revoke them; changing the password signs out other sessions. Optional TOTP two-factor authentication stores its secret encrypted (AES-256-GCM). State-changing requests from other origins are rejected. Abuse-prone endpoints are rate-limited (in memory, per server process). Evidence uploads are limited to PNG, JPEG, PDF and plain text (checked by file content, max 2 MB, 5 per report), stored in the database and only served as downloads to the reporter and administrators. Security events are written to `audit_events` without message contents.

## Tests

```
npm run test:unit                       # detection engines, TOTP, academy grading (no server needed)
npm test                                # unit + API integration tests (needs npm run dev running)
node tests/browser-smoke.mjs            # drives Chrome through every page at desktop and phone widths
```

The API and browser tests create throwaway `zz-test-*` / `zz-smoke-*` accounts and delete them afterwards.
