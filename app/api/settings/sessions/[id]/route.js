import { pool } from "@/lib/db";
import { audit, authenticate, HttpError, noContent, route } from "@/lib/server";

export const DELETE = route(async (request, { params }) => {
  const profile = await authenticate();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, "Session not found.");
  if (id === profile.session_id) throw new HttpError(400, "Use Log out to end the session you're using now.");
  const result = await pool.query("update user_sessions set revoked_at = now() where id = $1 and user_id = $2 and revoked_at is null", [id, profile.id]);
  if (!result.rowCount) throw new HttpError(404, "Session not found.");
  await audit("session_revoked", { userId: profile.id, actorId: profile.id });
  return noContent();
});
