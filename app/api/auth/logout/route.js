import { pool } from "@/lib/db";
import { clearSessionCookie, getCurrentUser, noContent, route } from "@/lib/server";

export const POST = route(async () => {
  const profile = await getCurrentUser();
  if (profile) await pool.query("update user_sessions set revoked_at = now() where id = $1", [profile.session_id]);
  await clearSessionCookie();
  return noContent();
});
