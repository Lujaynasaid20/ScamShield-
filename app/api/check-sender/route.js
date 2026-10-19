import { pool } from "@/lib/db";
import { getRecommendations } from "@/lib/recommendations";
import { historyItem, REPORT_STATUSES } from "@/lib/records";
import { normalizeSender } from "@/lib/sender";
import { HttpError, json, rateLimit, readBody, requireUser, route } from "@/lib/server";

export const POST = route(async request => {
  const profile = await requireUser();
  rateLimit(`check-sender:${profile.id}`, 20, 60 * 1000);
  const body = await readBody(request);
  const sender = normalizeSender(body.value, body.type);
  if (!sender.valid) throw new HttpError(400, sender.error);

  // Only category, status and dates of matching reports are shared: never the reporter or their description.
  const matches = await pool.query(
    `select id, scam_type, status, created_at, updated_at from scam_reports
      where sender_type = $1 and sender_normalized = $2 order by created_at desc limit 50`,
    [sender.type, sender.normalized]
  );
  const counts = { total: matches.rowCount, verified: 0, unverified: 0, rejected: 0, resolved: 0 };
  for (const row of matches.rows) {
    if (row.status === "verified") counts.verified += 1;
    else if (row.status === "rejected") counts.rejected += 1;
    else if (row.status === "resolved") counts.resolved += 1;
    else counts.unverified += 1;
  }
  const level = counts.verified > 0 ? "high" : counts.unverified + counts.resolved > 0 ? "medium" : "low";
  const score = Math.min(98, counts.verified * 35 + (counts.unverified + counts.resolved) * 12);
  const reports = matches.rows.map(row => ({ category: row.scam_type, status: row.status, statusLabel: REPORT_STATUSES[row.status], created_at: row.created_at, updated_at: row.updated_at }));
  const recommendations = getRecommendations({ kind: "sender", reportCounts: counts });
  const result = {
    type: sender.type,
    display: sender.display,
    notes: sender.notes,
    counts,
    reports,
    firstReported: reports.at(-1)?.created_at || null,
    lastReported: reports[0]?.created_at || null,
    recommendations
  };

  let item = null;
  if (body.save !== false) {
    const inserted = await pool.query(
      `insert into scam_cases (user_id, kind, message, score, risk_level, scam_type, details)
       values ($1, 'sender', $2, $3, $4, 'sender', $5) returning *`,
      [profile.id, sender.display, score, level, JSON.stringify({ type: sender.type, notes: sender.notes, counts, firstReported: result.firstReported, lastReported: result.lastReported, recommendations })]
    );
    item = historyItem(inserted.rows[0], { full: true });
  }
  return json({ result, item });
});
