import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import pg from "pg";

const { Pool } = pg;
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(rootDir, ".env.local") });

const app = express();
const pool = new Pool({
  ...(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {}),
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || "scamshield",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD
});
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const sessionCookie = "scamshield_session";
const isProduction = process.env.NODE_ENV === "production";
if (isProduction && !process.env.SESSION_SECRET) throw new Error("SESSION_SECRET must be set in production.");

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

const asyncRoute = handler => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

const publicProfile = profile => ({
  id: profile.id,
  email: profile.email,
  display_name: profile.display_name,
  role: profile.role,
  created_at: profile.created_at
});

function setSessionCookie(response, profile) {
  const token = jwt.sign({ sub: String(profile.id) }, sessionSecret, { expiresIn: "7d" });
  response.cookie(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/"
  });
}

const authenticate = asyncRoute(async (request, response, next) => {
  const token = request.headers.cookie?.split(";").map(part => part.trim()).find(part => part.startsWith(`${sessionCookie}=`))?.slice(sessionCookie.length + 1);
  if (!token) return response.status(401).json({ error: "Sign in is required." });

  let claims;
  try {
    claims = jwt.verify(decodeURIComponent(token), sessionSecret);
  } catch {
    return response.status(401).json({ error: "Your session has expired. Please sign in again." });
  }

  const result = await pool.query(
    "select id, email, display_name, role, created_at from profiles where id = $1",
    [claims.sub]
  );
  if (!result.rows[0]) return response.status(401).json({ error: "Your account could not be found." });
  request.profile = result.rows[0];
  next();
});

const requireAdmin = (request, response, next) => {
  if (request.profile.role !== "admin") return response.status(403).json({ error: "Admin access is required." });
  next();
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProduction ? 10 : 100,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many failed attempts. Please wait a few minutes and try again." }
});
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.get("/api/health", (request, response) => response.json({ ok: true }));

app.post("/api/auth/register", authLimiter, asyncRoute(async (request, response) => {
  const email = String(request.body.email || "").trim().toLowerCase();
  const displayName = String(request.body.display_name || "").trim();
  const password = String(request.body.password || "");
  if (!emailPattern.test(email)) return response.status(400).json({ error: "Enter a valid email address." });
  if (displayName.length < 2 || displayName.length > 120) return response.status(400).json({ error: "Enter a name between 2 and 120 characters." });
  if (password.length < 8 || password.length > 200) return response.status(400).json({ error: "Password must be at least 8 characters." });

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const result = await pool.query(
      "insert into profiles (email, display_name, password_hash) values ($1, $2, $3) returning id, email, display_name, role, created_at",
      [email, displayName, passwordHash]
    );
    const profile = result.rows[0];
    setSessionCookie(response, profile);
    response.status(201).json({ profile: publicProfile(profile) });
  } catch (error) {
    if (error.code === "23505") return response.status(409).json({ error: "An account with this email already exists." });
    throw error;
  }
}));

app.post("/api/auth/login", authLimiter, asyncRoute(async (request, response) => {
  const email = String(request.body.email || "").trim().toLowerCase();
  const password = String(request.body.password || "");
  const result = await pool.query("select * from profiles where email = $1", [email]);
  const profile = result.rows[0];
  if (!profile || !(await bcrypt.compare(password, profile.password_hash))) {
    return response.status(401).json({ error: "Email or password is incorrect." });
  }
  const isAdmin = profile.role === "admin";
  if (request.body.admin === true && !isAdmin) return response.status(403).json({ error: "This account is not an admin. Use the Log in tab." });
  if (request.body.admin !== true && isAdmin) return response.status(403).json({ error: "This is an admin account. Use the Admin tab to log in." });
  setSessionCookie(response, profile);
  response.json({ profile: publicProfile(profile) });
}));

app.get("/api/auth/session", authenticate, (request, response) => {
  response.json({ profile: publicProfile(request.profile) });
});

app.post("/api/auth/logout", (request, response) => {
  response.clearCookie(sessionCookie, { httpOnly: true, sameSite: "lax", secure: isProduction, path: "/" });
  response.status(204).end();
});

app.get("/api/account/data", authenticate, asyncRoute(async (request, response) => {
  const isAdmin = request.profile.role === "admin";
  const cases = isAdmin
    ? await pool.query("select * from scam_cases order by created_at desc limit 200")
    : await pool.query("select * from scam_cases where user_id = $1 order by created_at desc limit 200", [request.profile.id]);
  const reports = isAdmin
    ? await pool.query("select * from scam_reports order by created_at desc limit 200")
    : await pool.query("select * from scam_reports where user_id = $1 order by created_at desc limit 200", [request.profile.id]);
  const profiles = isAdmin
    ? await pool.query("select id, email, display_name, role, created_at from profiles order by created_at desc limit 500")
    : { rows: [] };
  response.json({ cases: cases.rows, reports: reports.rows, profiles: profiles.rows });
}));

app.post("/api/cases", authenticate, asyncRoute(async (request, response) => {
  const { message, score, risk_level: riskLevel, scam_type: scamType } = request.body;
  if (typeof message !== "string" || !message.trim() || message.length > 5000) return response.status(400).json({ error: "Message must contain 1 to 5000 characters." });
  if (!Number.isInteger(score) || score < 0 || score > 100) return response.status(400).json({ error: "Risk score is invalid." });
  if (!["low", "medium", "high"].includes(riskLevel)) return response.status(400).json({ error: "Risk level is invalid." });
  if (typeof scamType !== "string" || !scamType.trim()) return response.status(400).json({ error: "Scam type is required." });
  const result = await pool.query(
    "insert into scam_cases (user_id, message, score, risk_level, scam_type, signals, url_checks, phone_checks) values ($1, $2, $3, $4, $5, $6, $7, $8) returning *",
    [request.profile.id, message, score, riskLevel, scamType, JSON.stringify(request.body.signals || []), JSON.stringify(request.body.url_checks || []), JSON.stringify(request.body.phone_checks || [])]
  );
  response.status(201).json({ item: result.rows[0] });
}));

app.delete("/api/cases", authenticate, asyncRoute(async (request, response) => {
  await pool.query("delete from scam_cases where user_id = $1", [request.profile.id]);
  response.status(204).end();
}));

app.post("/api/reports", authenticate, asyncRoute(async (request, response) => {
  const scamType = String(request.body.scam_type || "").trim();
  const details = String(request.body.details || "").trim();
  const caseId = request.body.case_id || null;
  if (!scamType || scamType.length > 120) return response.status(400).json({ error: "Choose a valid scam type." });
  if (!details || details.length > 500) return response.status(400).json({ error: "Report details must contain 1 to 500 characters." });
  if (caseId) {
    const ownedCase = await pool.query("select id from scam_cases where id = $1 and user_id = $2", [caseId, request.profile.id]);
    if (!ownedCase.rowCount) return response.status(400).json({ error: "The selected case does not belong to your account." });
  }
  const result = await pool.query(
    "insert into scam_reports (user_id, case_id, scam_type, details) values ($1, $2, $3, $4) returning *",
    [request.profile.id, caseId, scamType, details]
  );
  response.status(201).json({ item: result.rows[0] });
}));

app.patch("/api/admin/reports/:id", authenticate, requireAdmin, asyncRoute(async (request, response) => {
  const statuses = ["open", "reviewing", "confirmed", "false_positive", "closed"];
  if (!statuses.includes(request.body.status)) return response.status(400).json({ error: "Report status is invalid." });
  const result = await pool.query("update scam_reports set status = $1 where id = $2 returning *", [request.body.status, request.params.id]);
  if (!result.rowCount) return response.status(404).json({ error: "Report not found." });
  response.json({ item: result.rows[0] });
}));

app.post("/api/admin/promote", authenticate, requireAdmin, asyncRoute(async (request, response) => {
  const email = String(request.body.email || "").trim().toLowerCase();
  if (!emailPattern.test(email)) return response.status(400).json({ error: "Enter a valid email address." });
  const result = await pool.query("update profiles set role = 'admin' where email = $1 returning id, email, display_name, role, created_at", [email]);
  if (!result.rowCount) return response.status(404).json({ error: "No registered account matches that email." });
  response.json({ profile: publicProfile(result.rows[0]) });
}));

if (isProduction) app.use(express.static(path.join(rootDir, "dist")));

app.use((error, request, response, next) => {
  console.error(error);
  if (response.headersSent) return next(error);
  if (error.code === "28P01") {
    return response.status(503).json({ error: "PostgreSQL rejected the configured username or password. Check PGUSER and PGPASSWORD in .env.local." });
  }
  if (error.code === "ECONNREFUSED" || error.code === "3D000") {
    return response.status(503).json({ error: "Cannot connect to PostgreSQL. Check the database is running and DATABASE_URL is correct." });
  }
  response.status(500).json({ error: "The server could not complete that request." });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`ScamShield API listening on http://localhost:${port}`));