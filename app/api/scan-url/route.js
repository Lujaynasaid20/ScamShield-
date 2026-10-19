import { pool } from "@/lib/db";
import { notify } from "@/lib/notify";
import { getRecommendations } from "@/lib/recommendations";
import { historyItem } from "@/lib/records";
import { checkUrlReputation } from "@/lib/reputation";
import { HttpError, json, rateLimit, readBody, requireUser, route } from "@/lib/server";
import { scanUrl } from "@/lib/url-scan";

export const POST = route(async request => {
  const profile = await requireUser();
  rateLimit(`scan-url:${profile.id}`, 20, 60 * 1000);
  const body = await readBody(request);
  const scan = scanUrl(body.url);
  if (!scan.valid) throw new HttpError(400, scan.error);

  // The URL is never opened by the server; only its text is sent to the reputation service, if configured.
  const reputation = await checkUrlReputation(scan.normalized);
  const reputationMatch = reputation.status === "match";
  const score = reputationMatch ? Math.max(scan.score, 95) : scan.score;
  const level = reputationMatch ? "high" : scan.level;
  const recommendations = getRecommendations({ kind: "url", level, reputationMatch, indicators: scan.indicators });
  const explanation = reputationMatch
    ? "A threat-intelligence service lists this address as dangerous."
    : scan.indicators.some(item => item.weight > 0)
      ? `The address shows ${scan.indicators.filter(item => item.weight > 0).length} heuristic warning sign(s) based on how it is written. These are indicators, not proof.`
      : "No heuristic warning signs were found in how this address is written. That does not prove the site is safe.";
  const details = { host: scan.host, domain: scan.domain, normalized: scan.normalized, heuristicScore: scan.score, indicators: scan.indicators, reputation, explanation, recommendations };

  const inserted = await pool.query(
    `insert into scam_cases (user_id, kind, message, score, risk_level, scam_type, details)
     values ($1, 'url', $2, $3, $4, $5, $6) returning *`,
    [profile.id, scan.input, score, level, level === "low" ? "other" : "phishing", JSON.stringify(details)]
  );
  const row = inserted.rows[0];
  await notify(profile.id, "analysis", { title: `URL scan complete: ${historyItem(row).verdictLabel}`, body: scan.domain, link: `/history/${row.id}` });
  return json({ item: historyItem(row, { full: true }) }, 201);
});
