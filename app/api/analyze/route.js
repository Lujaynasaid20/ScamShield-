import { analyzeMessage } from "@/lib/analyzer";
import { pool } from "@/lib/db";
import { notify } from "@/lib/notify";
import { getRecommendations } from "@/lib/recommendations";
import { historyItem } from "@/lib/records";
import { json, rateLimit, readBody, requireUser, route, text } from "@/lib/server";

export const POST = route(async request => {
  const profile = await requireUser();
  rateLimit(`analyze:${profile.id}`, 30, 60 * 1000);
  const body = await readBody(request);
  const message = text(body.message, { max: 5000, required: true, field: "Message" });

  const result = analyzeMessage(message);
  // The screenshot itself is never uploaded: the browser reads its text and sends only that.
  const source = body.source === "screenshot" ? "screenshot" : "text";
  if (source === "screenshot") result.limitations.unshift("The text was read from a screenshot. Letters, numbers and links can be misread, so check them against the original.");
  const recommendations = getRecommendations({ kind: "message", level: result.level, signals: result.signals, category: result.category });
  const details = { source, highlights: result.highlights, confidence: result.confidence, limitations: result.limitations, explanation: result.explanation, modelAssessment: result.modelAssessment, scoreBasis: result.scoreBasis, recommendations };

  // A repeated submission of the same message within two minutes reuses the saved record.
  const existing = await pool.query(
    "select * from scam_cases where user_id = $1 and kind = 'message' and message = $2 and created_at > now() - interval '2 minutes' order by created_at desc limit 1",
    [profile.id, result.message]
  );
  let row = existing.rows[0];
  if (!row) {
    const inserted = await pool.query(
      `insert into scam_cases (user_id, kind, message, score, risk_level, scam_type, signals, url_checks, phone_checks, details)
       values ($1, 'message', $2, $3, $4, $5, $6, $7, $8, $9) returning *`,
      [profile.id, result.message, result.score, result.level, result.category, JSON.stringify(result.signals), JSON.stringify(result.urlChecks), JSON.stringify(result.phoneChecks), JSON.stringify(details)]
    );
    row = inserted.rows[0];
    await notify(profile.id, "analysis", {
      title: `Message analysis complete: ${result.verdictLabel}`,
      body: `Risk score ${result.score}/100 · ${result.categoryLabel}`,
      link: `/history/${row.id}`
    });
  }
  return json({ item: historyItem(row, { full: true }), result, recommendations }, existing.rows[0] ? 200 : 201);
});
