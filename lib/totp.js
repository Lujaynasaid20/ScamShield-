// Time-based one-time passwords (RFC 6238) and encryption of stored secrets.
import crypto from "node:crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buffer) {
  let bits = 0, value = 0, output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { output += BASE32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
}

export function base32Decode(text) {
  const clean = text.replace(/=+$/, "").replace(/\s/g, "").toUpperCase();
  let bits = 0, value = 0;
  const bytes = [];
  for (const char of clean) {
    const index = BASE32.indexOf(char);
    if (index < 0) throw new Error("Invalid base32 character.");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(bytes);
}

export const generateSecret = () => base32Encode(crypto.randomBytes(20));

export function totpCode(secret, step) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = crypto.createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 15;
  const binary = ((hmac[offset] & 127) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(binary % 1000000).padStart(6, "0");
}

export const currentStep = (now = Date.now()) => Math.floor(now / 1000 / 30);

// Returns the matching time step (to block reuse), or null. Allows one step of clock drift.
export function verifyTotp(secret, code, { lastStep = null, now = Date.now() } = {}) {
  const clean = String(code || "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return null;
  const step = currentStep(now);
  for (const candidate of [step - 1, step, step + 1]) {
    if (lastStep !== null && candidate <= Number(lastStep)) continue;
    const expected = totpCode(secret, candidate);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(clean))) return candidate;
  }
  return null;
}

export const otpauthUri = (secret, email) => `otpauth://totp/${encodeURIComponent(`ScamShield:${email}`)}?secret=${secret}&issuer=ScamShield&algorithm=SHA1&digits=6&period=30`;

function encryptionKey() {
  const material = process.env.TOTP_ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!material) return null;
  return crypto.createHash("sha256").update(`scamshield-totp:${material}`).digest();
}

export const canStoreSecrets = () => Boolean(encryptionKey());

export function encryptSecret(secret) {
  const key = encryptionKey();
  if (!key) throw new Error("No encryption key configured.");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return `v1:${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(payload) {
  const key = encryptionKey();
  const [version, iv, tag, data] = String(payload || "").split(":");
  if (!key || version !== "v1") throw new Error("Cannot decrypt the two-factor secret.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
