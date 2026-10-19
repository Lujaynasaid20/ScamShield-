import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { notify } from "@/lib/notify";
import { audit, authenticate, HttpError, json, rateLimit, readBody, route } from "@/lib/server";

export const POST = route(async request => {
  const profile = await authenticate();
  rateLimit(`password:${profile.id}`, 10, 15 * 60 * 1000);
  const body = await readBody(request);
  const current = String(body.current_password || "");
  const next = String(body.new_password || "");
  const stored = (await pool.query("select password_hash from profiles where id = $1", [profile.id])).rows[0];
  if (!(await bcrypt.compare(current, stored.password_hash))) throw new HttpError(400, "Your current password is incorrect.");
  if (next.length < 8 || next.length > 200) throw new HttpError(400, "Your new password must be at least 8 characters.");
  if (next === current) throw new HttpError(400, "Choose a password you haven't used for this account.");

  await pool.query("update profiles set password_hash = $1, updated_at = now() where id = $2", [await bcrypt.hash(next, 12), profile.id]);
  // Sign out every other session: anyone using the old password loses access.
  const revoked = await pool.query("update user_sessions set revoked_at = now() where user_id = $1 and id <> $2 and revoked_at is null", [profile.id, profile.session_id]);
  await audit("password_changed", { userId: profile.id, actorId: profile.id, details: { other_sessions_revoked: revoked.rowCount } });
  await notify(profile.id, "security", { title: "Your password was changed", body: "Other devices were signed out. If you didn't do this, contact an administrator.", link: "/settings#security" });
  return json({ ok: true, other_sessions_revoked: revoked.rowCount });
});
