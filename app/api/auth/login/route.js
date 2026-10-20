import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { audit, createSession, isMobileClient, json, publicProfile, readBody, route, withAuthLimit } from "@/lib/server";
import { decryptSecret, verifyTotp } from "@/lib/totp";

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("scamshield-timing-placeholder", 12);

export const POST = withAuthLimit(route(async request => {
  const body = await readBody(request);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const result = await pool.query("select * from profiles where email = $1", [email]);
  const profile = result.rows[0];
  const passwordOk = await bcrypt.compare(password, profile?.password_hash || DUMMY_HASH);
  if (!profile || !passwordOk) {
    if (profile) await audit("login_failed", { userId: profile.id, details: { reason: "password" } });
    return json({ error: "Email or password is incorrect." }, 401);
  }
  const isAdmin = profile.role === "admin";
  const mobile = isMobileClient(body);
  if (mobile && isAdmin) return json({ error: "Administrator accounts use the ScamShield website, not the mobile app." }, 403);
  if (body.admin === true && !isAdmin) return json({ error: "This account is not an admin. Use the Log in tab." }, 403);
  if (body.admin !== true && isAdmin) return json({ error: "This is an admin account. Use the Admin tab to log in." }, 403);

  if (profile.totp_enabled) {
    if (!body.code) return json({ two_factor_required: true });
    let step = null;
    try { step = verifyTotp(decryptSecret(profile.totp_secret), body.code, { lastStep: profile.totp_last_step }); } catch (error) { console.error(error.message); }
    if (step === null) {
      await audit("login_failed", { userId: profile.id, details: { reason: "two_factor" } });
      return json({ error: "The verification code is incorrect or expired.", two_factor_required: true }, 401);
    }
    await pool.query("update profiles set totp_last_step = $1 where id = $2", [step, profile.id]);
  }

  const session = await createSession(profile, request, { mobile });
  await audit("login", { userId: profile.id, actorId: profile.id, details: mobile ? { client: "mobile" } : {} });
  return json({ profile: publicProfile(profile), ...(mobile ? { token: session.token, expires_in: session.expiresIn } : {}) });
}));
