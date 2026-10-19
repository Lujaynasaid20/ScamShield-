import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { audit, createSession, emailPattern, json, publicProfile, readBody, route, withAuthLimit } from "@/lib/server";

export const POST = withAuthLimit(route(async request => {
  const body = await readBody(request);
  const email = String(body.email || "").trim().toLowerCase();
  const displayName = String(body.display_name || "").trim();
  const password = String(body.password || "");
  if (!emailPattern.test(email) || email.length > 254) return json({ error: "Enter a valid email address." }, 400);
  if (displayName.length < 2 || displayName.length > 120) return json({ error: "Enter a name between 2 and 120 characters." }, 400);
  if (password.length < 8 || password.length > 200) return json({ error: "Password must be at least 8 characters." }, 400);

  const passwordHash = await bcrypt.hash(password, 12);
  let profile;
  try {
    const result = await pool.query(
      "insert into profiles (email, display_name, password_hash) values ($1, $2, $3) returning id, email, display_name, role, totp_enabled, created_at",
      [email, displayName, passwordHash]
    );
    profile = result.rows[0];
  } catch (error) {
    if (error.code === "23505") return json({ error: "An account with this email already exists." }, 409);
    throw error;
  }
  await pool.query("insert into user_preferences (user_id) values ($1) on conflict do nothing", [profile.id]);
  await createSession(profile, request);
  await audit("account_created", { userId: profile.id, actorId: profile.id });
  return json({ profile: publicProfile(profile) }, 201);
}));
