// Offline phone-number analysis with Google's libphonenumber metadata: validity, country and line type.
// It never identifies who owns a number. Server-only (the "max" metadata is too large for the browser).
import { parsePhoneNumberFromString } from "libphonenumber-js/max";

const LINE_TYPES = {
  MOBILE: "Mobile",
  FIXED_LINE: "Landline",
  FIXED_LINE_OR_MOBILE: "Landline or mobile",
  TOLL_FREE: "Toll-free",
  PREMIUM_RATE: "Premium-rate",
  SHARED_COST: "Shared-cost",
  VOIP: "Internet (VoIP) number",
  PERSONAL_NUMBER: "Personal forwarding number",
  PAGER: "Pager",
  UAN: "Company number (UAN)",
  VOICEMAIL: "Voicemail access"
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryName = code => { try { return regionNames.of(code) || code; } catch { return code; } };

// Returns { status, e164, formatted, country, countryName, callingCode, lineType, lineTypeLabel, notes }.
// status: "valid" | "invalid" | "no_country_code" | "short_code".
export function analyzePhone(rawValue) {
  const value = String(rawValue || "").trim();
  const digits = value.replace(/\D/g, "");
  const notes = [];
  const base = { e164: null, formatted: null, country: null, countryName: null, callingCode: null, lineType: null, lineTypeLabel: null, notes };

  if (digits.length <= 6) return { ...base, status: "short_code" };
  const international = value.startsWith("+") || value.startsWith("00");
  if (!international) {
    notes.push("No country code was given, so the country and network can't be identified. Enter it with the country code, like +255 754 123 456.");
    return { ...base, status: "no_country_code" };
  }

  const parsed = parsePhoneNumberFromString(`+${digits.replace(/^00/, "")}`);
  if (!parsed) {
    notes.push("This doesn't match any country's phone-number format. Check that it was copied correctly.");
    return { ...base, status: "invalid" };
  }
  const country = parsed.country || null;
  const result = {
    ...base,
    e164: parsed.number,
    formatted: parsed.formatInternational(),
    country,
    countryName: country ? countryName(country) : null,
    callingCode: `+${parsed.countryCallingCode}`
  };
  if (!parsed.isValid()) {
    notes.push(`This isn't a valid number for ${result.countryName || result.callingCode}. It may be mistyped, or a fake caller ID.`);
    return { ...result, status: "invalid" };
  }

  const lineType = parsed.getType() || null;
  result.lineType = lineType;
  result.lineTypeLabel = LINE_TYPES[lineType] || null;
  if (lineType === "VOIP") notes.push("This is an internet (VoIP) number. They are easy to get anonymously and are often used by scammers, though many legitimate services use them too.");
  if (lineType === "PREMIUM_RATE") notes.push("This is a premium-rate number. Calling or texting it can cost a lot. Don't call back unless you're sure who it belongs to.");
  if (lineType === "PERSONAL_NUMBER") notes.push("Personal forwarding numbers can redirect to any phone, so they don't reveal where a caller really is.");
  if (lineType === "TOLL_FREE") notes.push("Toll-free numbers are usually used by businesses, but scammers can quote or fake them too.");
  return { ...result, status: "valid" };
}
