// Normalizes phone numbers, email addresses and sender names so community reports can be matched.
import { brandFindings, BRANDS } from "./url-scan.js";

const FREE_EMAIL_DOMAINS = new Set(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com", "aol.com", "icloud.com", "proton.me", "protonmail.com", "gmx.com", "mail.com", "yandex.com"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function detectSenderType(value) {
  const input = String(value || "").trim();
  if (input.includes("@")) return "email";
  const digits = input.replace(/\D/g, "");
  if (/^[+\d\s().-]+$/.test(input) && digits.length >= 3) return "phone";
  return "name";
}

export function normalizeSender(rawValue, requestedType) {
  const value = String(rawValue || "").trim();
  const type = ["phone", "email", "name"].includes(requestedType) ? requestedType : detectSenderType(value);
  const notes = [];
  if (!value) return { type, valid: false, error: "Enter a phone number, email address or sender name." };
  if (value.length > 200) return { type, valid: false, error: "That value is too long (200 characters maximum)." };

  if (type === "phone") {
    if (!/^[+\d\s().-]+$/.test(value)) return { type, valid: false, error: "A phone number can only contain digits, spaces, +, -, ( and )." };
    const digits = value.replace(/\D/g, "");
    if (digits.length < 3 || digits.length > 15) return { type, valid: false, error: "Phone numbers have between 3 and 15 digits." };
    const international = value.startsWith("+") || value.startsWith("00");
    // Match on the last 9 digits so local (07…) and international (+2547…) forms find the same reports.
    const normalized = digits.length > 9 ? digits.slice(-9) : digits;
    const display = international ? `+${digits.replace(/^00/, "")}` : digits;
    if (digits.length <= 6) notes.push("This looks like a short code. Short codes are usually run by registered businesses, but scammers can still mention them.");
    else if (digits.length < 9) notes.push("This number is shorter than most mobile numbers. Check that it was copied completely.");
    if (!international && digits.length >= 9) notes.push("No country code was given, so local and international versions are matched using the last 9 digits.");
    return { type, valid: true, value, normalized, display, notes };
  }

  if (type === "email") {
    const email = value.toLowerCase();
    if (!emailPattern.test(email)) return { type, valid: false, error: "Enter a valid email address, like name@example.com." };
    const [localPart, domain] = email.split("@");
    if (FREE_EMAIL_DOMAINS.has(domain)) {
      const brand = Object.keys(BRANDS).find(name => localPart.includes(name));
      if (brand) notes.push(`The address mentions "${brand}" but uses a free ${domain} mailbox. Real companies normally email from their own domain.`);
      else notes.push(`This is a free ${domain} mailbox. Anyone can create one, so check claims of being an official organization.`);
    }
    for (const finding of brandFindings(domain)) notes.push(finding.detail);
    if (!notes.length) notes.push("The address format is valid. ScamShield cannot verify who controls an email address.");
    return { type, valid: true, value: email, normalized: email, display: email, notes };
  }

  const name = value.replace(/\s+/g, " ");
  if (name.length < 2) return { type, valid: false, error: "Enter at least 2 characters." };
  const normalized = name.toLowerCase();
  notes.push("Sender names are easy to fake. A name that matches a real organization does not prove the message came from it.");
  return { type, valid: true, value: name, normalized, display: name, notes };
}

// Risk level and status labels for a sender check. Not knowing who owns a sender never raises the risk:
// only community reports do, and only administrator-verified reports make it "high".
export function assessSender({ counts, verifiedBusiness = null, registeredBusinessName = null }) {
  const credible = counts.verified;
  const unverified = counts.unverified + counts.resolved;
  const riskLevel = credible > 0 ? "high" : unverified > 0 ? "medium" : verifiedBusiness ? "low" : "unknown";
  const statuses = [];
  if (verifiedBusiness) statuses.push({ id: "verified_business", label: "Verified Business", tone: "safe", icon: "bi-patch-check", detail: `Listed in ScamShield's directory as an official contact for ${verifiedBusiness.name}.` });
  if (credible > 0) statuses.push({ id: "reported_scam", label: "Reported Scam Number", tone: "danger", icon: "bi-exclamation-octagon", detail: `${credible} report${credible === 1 ? " has" : "s have"} been verified by an administrator.` });
  else if (unverified > 0) statuses.push({ id: "reported_unverified", label: "Reported (Unverified)", tone: "warn", icon: "bi-flag", detail: `${unverified} community report${unverified === 1 ? " is" : "s are"} waiting for, or did not need, administrator verification.` });
  else statuses.push({ id: "no_reports", label: "No Reports Found", tone: "neutral", icon: "bi-search", detail: "No matching reports were found. That does not prove the sender is safe." });
  if (!verifiedBusiness && !registeredBusinessName) statuses.push({ id: "identity_unavailable", label: "Identity Unavailable", tone: "neutral", icon: "bi-person-dash", detail: "The owner could not be verified. This is normal for personal numbers and is not a sign of a scam on its own." });
  return { riskLevel, statuses };
}
