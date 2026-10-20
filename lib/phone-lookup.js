// Optional carrier lookup through Twilio Lookup v2 (Line Type Intelligence, plus Caller Name for US numbers).
// Only the phone number is sent. Credentials stay on the server. Results are cached because lookups are billed.
// A caller name is kept only when the carrier record says it belongs to a business, never a private person.
import { pool } from "./db";

const PROVIDER = "Twilio Lookup";
const CACHE_DAYS = 30;
const TYPE_LABELS = {
  mobile: "Mobile",
  landline: "Landline",
  fixedVoip: "Internet (VoIP) number tied to an address",
  nonFixedVoip: "Internet (VoIP) number, not tied to an address",
  personal: "Personal number",
  tollFree: "Toll-free",
  premium: "Premium-rate",
  sharedCost: "Shared-cost",
  uan: "Company number (UAN)",
  voicemail: "Voicemail",
  pager: "Pager"
};

export const carrierLookupConfigured = () => Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
const callerNameEnabled = () => process.env.TWILIO_LOOKUP_CALLER_NAME === "true";

function summarize(data, country) {
  const line = data.line_type_intelligence || {};
  const caller = data.caller_name || {};
  return {
    carrier: line.carrier_name || null,
    lineType: line.type || null,
    lineTypeLabel: TYPE_LABELS[line.type] || null,
    // Caller Name (CNAM) exists only for US numbers. Consumer names are dropped here and never stored.
    businessName: country === "US" && caller.caller_type === "BUSINESS" && caller.caller_name ? String(caller.caller_name).slice(0, 120) : null
  };
}

// Returns { provider, status: "found" | "not_found" | "not_configured" | "limited" | "error", carrier, lineType, lineTypeLabel, businessName, message }.
export async function lookupCarrier(e164, country, { limited = false } = {}) {
  const empty = { provider: PROVIDER, carrier: null, lineType: null, lineTypeLabel: null, businessName: null };
  if (!carrierLookupConfigured()) {
    return { ...empty, status: "not_configured", message: "Network lookup isn't set up on this ScamShield server, so the carrier can't be shown." };
  }
  if (limited) return { ...empty, status: "limited", message: "You've reached today's limit for network lookups. Community reports were still checked." };
  const withMessage = info => ({
    ...empty, ...info, status: info.carrier || info.businessName ? "found" : "not_found",
    message: info.carrier || info.businessName ? `Network details from ${PROVIDER}. Numbers can be moved between networks, and caller ID can be faked.` : `${PROVIDER} has no network details for this number.`
  });

  try {
    const cached = await pool.query(`select data from phone_lookup_cache where e164 = $1 and fetched_at > now() - interval '${CACHE_DAYS} days'`, [e164]);
    if (cached.rowCount) return withMessage(cached.rows[0].data);
  } catch (error) {
    console.error("Phone lookup cache read failed:", error.message);
  }

  try {
    const fields = ["line_type_intelligence", ...(country === "US" && callerNameEnabled() ? ["caller_name"] : [])];
    const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
    const response = await fetch(`https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(e164)}?Fields=${fields.join(",")}`, {
      headers: { Authorization: `Basic ${auth}` },
      signal: AbortSignal.timeout(6000),
      redirect: "error"
    });
    if (response.status === 404) return withMessage({});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const info = summarize(await response.json(), country);
    await pool.query(
      `insert into phone_lookup_cache (e164, provider, data) values ($1, $2, $3)
       on conflict (e164) do update set provider = excluded.provider, data = excluded.data, fetched_at = now()`,
      [e164, PROVIDER, JSON.stringify(info)]
    ).catch(error => console.error("Phone lookup cache write failed:", error.message));
    return withMessage(info);
  } catch (error) {
    console.error("Phone lookup failed:", error.message);
    return { ...empty, status: "error", message: "The network lookup service couldn't be reached, so the carrier isn't shown. Community reports were still checked." };
  }
}
