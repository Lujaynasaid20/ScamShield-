import { pool } from "@/lib/db";
import { analyzePhone } from "@/lib/phone";
import { lookupCarrier } from "@/lib/phone-lookup";
import { getRecommendations } from "@/lib/recommendations";
import { historyItem, REPORT_STATUSES } from "@/lib/records";
import { assessSender, normalizeSender } from "@/lib/sender";
import { HttpError, json, rateLimit, readBody, requireUser, route } from "@/lib/server";

const LOOKUPS_PER_DAY = 30;

export const POST = route(async request => {
  const profile = await requireUser();
  rateLimit(`check-sender:${profile.id}`, 20, 60 * 1000);
  const body = await readBody(request);
  const sender = normalizeSender(body.value, body.type);
  if (!sender.valid) throw new HttpError(400, sender.error);

  const phone = sender.type === "phone" ? analyzePhone(sender.value) : null;
  const e164 = phone?.status === "valid" ? phone.e164 : null;
  // Phones match on the last 9 digits; when both sides know the full number, it must also be the same country.
  const directoryKey = sender.type === "phone" ? e164 : sender.type === "email" ? sender.normalized : null;

  let carrierPromise = null;
  if (e164) {
    let limited = false;
    try { rateLimit(`phone-lookup:${profile.id}`, LOOKUPS_PER_DAY, 24 * 60 * 60 * 1000); } catch { limited = true; }
    carrierPromise = lookupCarrier(e164, phone.country, { limited });
  }
  const [matches, directory, carrier] = await Promise.all([
    // Only category, status, claimed name and dates of matching reports are shared: never the reporter or their description.
    pool.query(
      `select id, scam_type, status, claimed_identity, created_at, updated_at from scam_reports
        where sender_type = $1 and sender_normalized = $2 and ($3::text is null or sender_e164 is null or sender_e164 = $3)
        order by created_at desc limit 50`,
      [sender.type, sender.normalized, e164]
    ),
    directoryKey
      ? pool.query("select business_name, source from verified_senders where sender_type = $1 and match_key = $2", [sender.type, directoryKey])
      : null,
    carrierPromise
  ]);

  const counts = { total: matches.rowCount, verified: 0, unverified: 0, rejected: 0, resolved: 0 };
  // Names the sender claimed to be and reported categories, grouped. Rejected reports are left out.
  const claimed = new Map();
  const categoryCounts = new Map();
  for (const row of matches.rows) {
    if (row.status === "verified") counts.verified += 1;
    else if (row.status === "rejected") counts.rejected += 1;
    else if (row.status === "resolved") counts.resolved += 1;
    else counts.unverified += 1;
    if (row.status === "rejected") continue;
    categoryCounts.set(row.scam_type, (categoryCounts.get(row.scam_type) || 0) + 1);
    if (!row.claimed_identity) continue;
    const key = row.claimed_identity.toLowerCase();
    const entry = claimed.get(key) || { name: row.claimed_identity, reports: 0, verified: false };
    entry.reports += 1;
    entry.verified ||= row.status === "verified";
    claimed.set(key, entry);
  }
  const claimedNames = [...claimed.values()].sort((a, b) => b.verified - a.verified || b.reports - a.reports).slice(0, 10);
  const categories = [...categoryCounts].map(([category, reports]) => ({ category, reports })).sort((a, b) => b.reports - a.reports);

  const listing = directory?.rows[0];
  const verifiedBusiness = listing ? { name: listing.business_name, source: listing.source } : null;
  const identity = verifiedBusiness
    ? { status: "verified", name: verifiedBusiness.name, source: "ScamShield verified business directory", detail: verifiedBusiness.source }
    : carrier?.businessName
      ? { status: "registered", name: carrier.businessName, source: `Carrier caller-name record (${carrier.provider})`, detail: "The name registered with the phone carrier. It hasn't been checked by ScamShield." }
      : { status: "unavailable", name: null, source: null, detail: sender.type === "name" ? "Sender names can't be verified: anyone can type any name." : "No authorized source identifies who owns this sender. ScamShield never guesses or shows private owners' names." };
  const { riskLevel, statuses } = assessSender({ counts, verifiedBusiness, registeredBusinessName: carrier?.businessName });

  const score = Math.min(98, counts.verified * 35 + (counts.unverified + counts.resolved) * 12);
  const reports = matches.rows.map(row => ({ category: row.scam_type, status: row.status, statusLabel: REPORT_STATUSES[row.status], created_at: row.created_at, updated_at: row.updated_at }));
  const recommendations = getRecommendations({ kind: "sender", reportCounts: counts, verifiedBusiness });
  const phoneInfo = phone && { status: phone.status, e164: phone.e164, formatted: phone.formatted, country: phone.country, countryName: phone.countryName, callingCode: phone.callingCode, lineType: phone.lineType, lineTypeLabel: phone.lineTypeLabel };
  const summary = {
    type: sender.type,
    notes: [...sender.notes, ...(phone?.notes || [])],
    phone: phoneInfo,
    carrier,
    identity,
    riskLevel,
    statuses,
    counts,
    categories,
    claimedNames,
    firstReported: reports.at(-1)?.created_at || null,
    lastReported: reports[0]?.created_at || null,
    recommendations
  };
  const result = { ...summary, display: phone?.formatted || sender.display, reports };

  let item = null;
  if (body.save !== false) {
    // risk_level only stores low/medium/high; "unknown" is kept in details.riskLevel.
    const inserted = await pool.query(
      `insert into scam_cases (user_id, kind, message, score, risk_level, scam_type, details)
       values ($1, 'sender', $2, $3, $4, 'sender', $5) returning *`,
      [profile.id, result.display, score, riskLevel === "unknown" ? "low" : riskLevel, JSON.stringify(summary)]
    );
    item = historyItem(inserted.rows[0], { full: true });
  }
  return json({ result, item });
});
