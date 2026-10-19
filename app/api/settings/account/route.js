import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { audit, authenticate, clearSessionCookie, HttpError, json, noContent, readBody, route } from "@/lib/server";

const EVENT_LABELS = {
  account_created: "Account created",
  login: "Signed in",
  login_failed: "Failed sign-in attempt",
  password_changed: "Password changed",
  email_changed: "Email address changed",
  two_factor_enabled: "Two-factor authentication turned on",
  two_factor_disabled: "Two-factor authentication turned off",
  sessions_revoked: "Other sessions signed out",
  session_revoked: "A session was signed out",
  history_cleared: "Scam history cleared",
  promoted_to_admin: "Granted administrator access"
};

// Recent security activity for the account (no message contents are ever logged).
export const GET = route(async () => {
  const profile = await authenticate();
  const rows = await pool.query(
    `select id, event, created_at from audit_events where user_id = $1 and event = any($2::text[]) order by created_at desc limit 15`,
    [profile.id, Object.keys(EVENT_LABELS)]
  );
  return json({ events: rows.rows.map(row => ({ id: row.id, label: EVENT_LABELS[row.event], event: row.event, created_at: row.created_at })) });
});

// Permanently deletes the account and all of its data (history, reports, evidence, notifications, progress).
export const DELETE = route(async request => {
  const profile = await authenticate();
  const body = await readBody(request);
  if (body.confirm !== "DELETE") throw new HttpError(400, "Type DELETE to confirm.");
  const stored = (await pool.query("select password_hash from profiles where id = $1", [profile.id])).rows[0];
  if (!(await bcrypt.compare(String(body.password || ""), stored.password_hash))) throw new HttpError(400, "Your password is incorrect.");
  if (profile.role === "admin") {
    const admins = Number((await pool.query("select count(*) from profiles where role = 'admin'")).rows[0].count);
    if (admins <= 1) throw new HttpError(409, "You are the only administrator. Promote another admin before deleting this account.");
  }
  await audit("account_deleted", { actorId: null, details: { role: profile.role } });
  await pool.query("delete from profiles where id = $1", [profile.id]);
  await clearSessionCookie();
  return noContent();
});
