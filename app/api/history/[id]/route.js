import { analyzeMessage } from "@/lib/analyzer";
import { pool } from "@/lib/db";
import { getRecommendations } from "@/lib/recommendations";
import { historyItem } from "@/lib/records";
import { HttpError, json, noContent, positiveId, requireUser, route } from "@/lib/server";

export const GET = route(async (request, { params }) => {
  const profile = await requireUser();
  const id = positiveId((await params).id);
  const result = await pool.query("select * from scam_cases where id = $1 and user_id = $2", [id, profile.id]);
  if (!result.rows[0]) throw new HttpError(404, "This history entry was not found.");
  const item = historyItem(result.rows[0], { full: true });
  // Entries saved before the upgrade have no stored explanation; rebuild it from the message.
  if (item.kind === "message" && !item.details.explanation) {
    const analysis = analyzeMessage(item.input);
    item.details = {
      highlights: analysis.highlights, confidence: analysis.confidence, limitations: analysis.limitations, explanation: analysis.explanation,
      recommendations: getRecommendations({ kind: "message", level: item.level, signals: item.signals, category: item.category })
    };
  }
  return json({ item });
});

export const DELETE = route(async (request, { params }) => {
  const profile = await requireUser();
  const id = positiveId((await params).id);
  const result = await pool.query("delete from scam_cases where id = $1 and user_id = $2", [id, profile.id]);
  if (!result.rowCount) throw new HttpError(404, "This history entry was not found.");
  return noContent();
});
