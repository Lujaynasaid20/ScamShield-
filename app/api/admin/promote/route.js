import { pool } from "@/lib/db";
import { notify } from "@/lib/notify";
import { audit, emailPattern, json, publicProfile, readBody, requireAdmin, route } from "@/lib/server";

export const POST = route(async request => {
  const admin = await requireAdmin();
  const body = await readBody(request);
  const email = String(body.email || "").trim().toLowerCase();
  if (!emailPattern.test(email)) return json({ error: "Enter a valid email address." }, 400);
  const result = await pool.query("update profiles set role = 'admin', updated_at = now() where email = $1 and role <> 'admin' returning id, email, display_name, role, totp_enabled, created_at", [email]);
  if (!result.rowCount) {
    const exists = await pool.query("select role from profiles where email = $1", [email]);
    return exists.rowCount ? json({ error: "That account is already an administrator." }, 409) : json({ error: "No registered account matches that email." }, 404);
  }
  const promoted = result.rows[0];
  await audit("promoted_to_admin", { userId: promoted.id, actorId: admin.id });
  await notify(promoted.id, "security", { title: "You now have administrator access", body: "Sign in through the Admin tab to use the admin area.", link: "/admin" });
  return json({ profile: publicProfile(promoted) });
});
