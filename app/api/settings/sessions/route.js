import { pool } from "@/lib/db";
import { notify } from "@/lib/notify";
import { audit, authenticate, json, route } from "@/lib/server";

function describeAgent(userAgent) {
  if (!userAgent) return "Unknown device";
  const browser = /Edg\//.test(userAgent) ? "Edge" : /OPR\//.test(userAgent) ? "Opera" : /Chrome\//.test(userAgent) ? "Chrome" : /Firefox\//.test(userAgent) ? "Firefox" : /Safari\//.test(userAgent) ? "Safari" : /curl|node|undici/i.test(userAgent) ? "Script or API client" : "Browser";
  const os = /Windows/.test(userAgent) ? "Windows" : /Android/.test(userAgent) ? "Android" : /iPhone|iPad/.test(userAgent) ? "iOS" : /Mac OS X/.test(userAgent) ? "macOS" : /Linux/.test(userAgent) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}

export const GET = route(async () => {
  const profile = await authenticate();
  const rows = await pool.query(
    `select id, user_agent, created_at, last_seen_at from user_sessions
      where user_id = $1 and revoked_at is null and created_at > now() - interval '7 days' order by last_seen_at desc`,
    [profile.id]
  );
  return json({ sessions: rows.rows.map(row => ({ id: row.id, device: describeAgent(row.user_agent), created_at: row.created_at, last_seen_at: row.last_seen_at, current: row.id === profile.session_id })) });
});

// Signs out all sessions except the current one.
export const DELETE = route(async () => {
  const profile = await authenticate();
  const result = await pool.query("update user_sessions set revoked_at = now() where user_id = $1 and id <> $2 and revoked_at is null", [profile.id, profile.session_id]);
  if (result.rowCount) {
    await audit("sessions_revoked", { userId: profile.id, actorId: profile.id, details: { count: result.rowCount } });
    await notify(profile.id, "security", { title: `Signed out ${result.rowCount} other session${result.rowCount === 1 ? "" : "s"}`, body: "Only this device is still signed in.", link: "/settings#security" });
  }
  return json({ revoked: result.rowCount });
});
