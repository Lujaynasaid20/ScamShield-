import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { pool } from "./db";

const isProduction = process.env.NODE_ENV === "production";
const sessionCookie = "scamshield_session";
const sessionMaxAgeSeconds = 7 * 24 * 60 * 60;
const globalForServer = globalThis;
globalForServer.scamshieldSessionSecret ??= process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const sessionSecret = globalForServer.scamshieldSessionSecret;
if (isProduction && !process.env.SESSION_SECRET) throw new Error("SESSION_SECRET must be set in production.");

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export const json = (body, status = 200) => NextResponse.json(body, { status });
export const noContent = () => new NextResponse(null, { status: 204 });

export const publicProfile = profile => ({
  id: profile.id,
  email: profile.email,
  display_name: profile.display_name,
  role: profile.role,
  totp_enabled: Boolean(profile.totp_enabled),
  created_at: profile.created_at
});

export async function readBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : {};
  } catch {
    return {};
  }
}

export function text(value, { max = 2000, required = false, field = "Value" } = {}) {
  const result = typeof value === "string" ? value.trim() : "";
  if (required && !result) throw new HttpError(400, `${field} is required.`);
  if (result.length > max) throw new HttpError(400, `${field} must be ${max} characters or fewer.`);
  return result;
}

export function positiveId(value) {
  const id = String(value ?? "");
  if (!/^\d{1,18}$/.test(id)) throw new HttpError(404, "Not found.");
  return id;
}

export function pagination(searchParams, { defaultSize = 10, maxSize = 50 } = {}) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(maxSize, Math.max(1, Number.parseInt(searchParams.get("pageSize") || String(defaultSize), 10) || defaultSize));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export const pageResult = (items, total, { page, pageSize }) => ({
  items,
  page,
  pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / pageSize))
});

// Sessions: a signed cookie that points at a user_sessions row, so sessions can be listed and revoked.
export async function createSession(profile, request) {
  const sessionId = crypto.randomUUID();
  const userAgent = (request.headers.get("user-agent") || "").slice(0, 300);
  await pool.query("insert into user_sessions (id, user_id, user_agent) values ($1, $2, $3)", [sessionId, profile.id, userAgent]);
  const token = jwt.sign({ sub: String(profile.id), sid: sessionId }, sessionSecret, { expiresIn: sessionMaxAgeSeconds });
  (await cookies()).set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: sessionMaxAgeSeconds,
    path: "/"
  });
  return sessionId;
}

export async function clearSessionCookie() {
  (await cookies()).set(sessionCookie, "", { httpOnly: true, sameSite: "lax", secure: isProduction, maxAge: 0, path: "/" });
}

async function readSession() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return { error: "Sign in is required." };
  let claims;
  try {
    claims = jwt.verify(token, sessionSecret);
  } catch {
    return { error: "Your session has expired. Please sign in again." };
  }
  if (!claims.sid) return { error: "Your session has expired. Please sign in again." };
  const result = await pool.query(
    `select p.id, p.email, p.display_name, p.role, p.totp_enabled, p.created_at, p.academy_notified_version,
            s.id as session_id, s.last_seen_at, s.created_at as session_created_at
       from user_sessions s join profiles p on p.id = s.user_id
      where s.id = $1 and s.user_id = $2 and s.revoked_at is null
        and s.created_at > now() - interval '7 days'`,
    [claims.sid, claims.sub]
  );
  const profile = result.rows[0];
  if (!profile) return { error: "Your session has ended. Please sign in again." };
  if (Date.now() - new Date(profile.last_seen_at).getTime() > 5 * 60 * 1000) {
    await pool.query("update user_sessions set last_seen_at = now() where id = $1", [profile.session_id]);
  }
  return { profile };
}

export async function authenticate() {
  const { profile, error } = await readSession();
  if (!profile) throw new HttpError(401, error);
  return profile;
}

export async function requireUser() {
  const profile = await authenticate();
  if (profile.role !== "user") throw new HttpError(403, "This feature is for user accounts. Administrators use the admin area.");
  return profile;
}

export async function requireAdmin() {
  const profile = await authenticate();
  if (profile.role !== "admin") throw new HttpError(403, "Admin access is required.");
  return profile;
}

// For server components: returns the signed-in profile or null without throwing.
export async function getCurrentUser() {
  try {
    return (await readSession()).profile || null;
  } catch {
    return null;
  }
}

export async function clientKey() {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0].trim() || headerList.get("x-real-ip") || "local";
}

// Fixed-window in-memory rate limiting. Suitable for a single server process.
globalForServer.scamshieldRateLimits ??= new Map();
const rateBuckets = globalForServer.scamshieldRateLimits;

export function rateLimit(key, max, windowMs, message = "Too many requests. Please wait a moment and try again.") {
  const now = Date.now();
  let bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > max) throw new HttpError(429, message);
  if (rateBuckets.size > 10000) {
    for (const [bucketKey, value] of rateBuckets) if (value.resetAt <= now) rateBuckets.delete(bucketKey);
  }
}

// Counts failed sign-in attempts per client, like express-rate-limit with skipSuccessfulRequests.
const authWindowMs = 15 * 60 * 1000;
const authLimit = isProduction ? 10 : 100;
globalForServer.scamshieldAuthFailures ??= new Map();
const authFailures = globalForServer.scamshieldAuthFailures;

export function withAuthLimit(handler) {
  return async (request, context) => {
    const key = await clientKey();
    const now = Date.now();
    const entry = authFailures.get(key);
    if (entry && entry.resetAt <= now) authFailures.delete(key);
    if ((authFailures.get(key)?.count || 0) >= authLimit) {
      return json({ error: "Too many failed attempts. Please wait a few minutes and try again." }, 429);
    }
    const response = await handler(request, context);
    if (response.status >= 400) {
      const current = authFailures.get(key) || { count: 0, resetAt: now + authWindowMs };
      current.count += 1;
      authFailures.set(key, current);
    }
    return response;
  };
}

// Rejects cross-site state-changing requests (defense in depth on top of SameSite cookies).
function checkOrigin(request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  let originHost;
  try { originHost = new URL(origin).host; } catch { originHost = ""; }
  if (originHost !== host) throw new HttpError(403, "Cross-site requests are not allowed.");
}

export function route(handler) {
  return async (request, context) => {
    try {
      checkOrigin(request);
      return await handler(request, context);
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message, ...error.extra }, error.status);
      console.error(error);
      if (error.code === "28P01") {
        return json({ error: "PostgreSQL rejected the configured username or password. Check PGUSER and PGPASSWORD in .env.local." }, 503);
      }
      if (error.code === "ECONNREFUSED" || error.code === "3D000") {
        return json({ error: "Cannot connect to PostgreSQL. Check the database is running and DATABASE_URL is correct." }, 503);
      }
      if (error.code === "42P01" || error.code === "42703") {
        return json({ error: "The database schema is out of date. Run npm run migrate." }, 503);
      }
      return json({ error: "The server could not complete that request." }, 500);
    }
  };
}

export async function audit(event, { userId = null, actorId = null, details = {} } = {}) {
  try {
    await pool.query("insert into audit_events (user_id, actor_id, event, details) values ($1, $2, $3, $4)", [userId, actorId, event, JSON.stringify(details)]);
  } catch (error) {
    console.error("Audit log failed", error);
  }
}
