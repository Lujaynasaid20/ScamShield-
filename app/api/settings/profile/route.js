import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { notify } from "@/lib/notify";
import { audit, authenticate, emailPattern, HttpError, json, publicProfile, readBody, route } from "@/lib/server";

export const PATCH = route(async request => {
  const profile = await authenticate();
  const body = await readBody(request);
  const displayName = String(body.display_name ?? profile.display_name).trim();
  const email = String(body.email ?? profile.email).trim().toLowerCase();
  if (displayName.length < 2 || displayName.length > 120) throw new HttpError(400, "Enter a name between 2 and 120 characters.");
  if (!emailPattern.test(email) || email.length > 254) throw new HttpError(400, "Enter a valid email address.");

  const emailChanged = email !== profile.email;
  if (emailChanged) {
    const stored = (await pool.query("select password_hash from profiles where id = $1", [profile.id])).rows[0];
    if (!(await bcrypt.compare(String(body.current_password || ""), stored.password_hash))) throw new HttpError(400, "Enter your current password to change your email address.");
  }
  let updated;
  try {
    updated = (await pool.query(
      "update profiles set display_name = $1, email = $2, updated_at = now() where id = $3 returning id, email, display_name, role, totp_enabled, created_at",
      [displayName, email, profile.id]
    )).rows[0];
  } catch (error) {
    if (error.code === "23505") throw new HttpError(409, "Another account already uses that email address.");
    throw error;
  }
  if (emailChanged) {
    await audit("email_changed", { userId: profile.id, actorId: profile.id });
    await notify(profile.id, "security", { title: "Your email address was changed", body: `Your sign-in email is now ${email}. If you didn't do this, change your password immediately.`, link: "/settings#security" });
  }
  return json({ profile: publicProfile(updated) });
});
