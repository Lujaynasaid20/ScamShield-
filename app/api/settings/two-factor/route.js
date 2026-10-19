import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import { pool } from "@/lib/db";
import { notify } from "@/lib/notify";
import { audit, authenticate, HttpError, json, rateLimit, readBody, route } from "@/lib/server";
import { canStoreSecrets, decryptSecret, encryptSecret, generateSecret, otpauthUri, verifyTotp } from "@/lib/totp";

// action "setup": create a pending secret; "enable": confirm with a code; "disable": requires password and code.
export const POST = route(async request => {
  const profile = await authenticate();
  rateLimit(`two-factor:${profile.id}`, 15, 15 * 60 * 1000);
  const body = await readBody(request);
  const stored = (await pool.query("select password_hash, totp_secret, totp_enabled, totp_last_step from profiles where id = $1", [profile.id])).rows[0];

  if (body.action === "setup") {
    if (stored.totp_enabled) throw new HttpError(409, "Two-factor authentication is already on.");
    if (!canStoreSecrets()) throw new HttpError(503, "Two-factor authentication needs SESSION_SECRET (or TOTP_ENCRYPTION_KEY) to be set on the server.");
    const secret = generateSecret();
    await pool.query("update profiles set totp_secret = $1, totp_last_step = null where id = $2", [encryptSecret(secret), profile.id]);
    const uri = otpauthUri(secret, profile.email);
    const qrSvg = await QRCode.toString(uri, { type: "svg", margin: 1, width: 200 });
    return json({ secret, uri, qr_svg: qrSvg });
  }

  if (body.action === "enable") {
    if (stored.totp_enabled) throw new HttpError(409, "Two-factor authentication is already on.");
    if (!stored.totp_secret) throw new HttpError(400, "Start the setup first.");
    const step = verifyTotp(decryptSecret(stored.totp_secret), body.code);
    if (step === null) throw new HttpError(400, "That code is incorrect or expired. Check your device's clock and try the newest code.");
    await pool.query("update profiles set totp_enabled = true, totp_last_step = $1, updated_at = now() where id = $2", [step, profile.id]);
    await audit("two_factor_enabled", { userId: profile.id, actorId: profile.id });
    await notify(profile.id, "security", { title: "Two-factor authentication is on", body: "You'll need a code from your authenticator app when you sign in.", link: "/settings#security" });
    return json({ enabled: true });
  }

  if (body.action === "disable") {
    if (!stored.totp_enabled) throw new HttpError(409, "Two-factor authentication is already off.");
    if (!(await bcrypt.compare(String(body.password || ""), stored.password_hash))) throw new HttpError(400, "Your password is incorrect.");
    if (verifyTotp(decryptSecret(stored.totp_secret), body.code, { lastStep: stored.totp_last_step }) === null) throw new HttpError(400, "That code is incorrect or expired.");
    await pool.query("update profiles set totp_enabled = false, totp_secret = null, totp_last_step = null, updated_at = now() where id = $1", [profile.id]);
    await audit("two_factor_disabled", { userId: profile.id, actorId: profile.id });
    await notify(profile.id, "security", { title: "Two-factor authentication was turned off", body: "If you didn't do this, change your password now.", link: "/settings#security" });
    return json({ enabled: false });
  }

  throw new HttpError(400, "Unknown action.");
});
