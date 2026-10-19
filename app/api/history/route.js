import { pool } from "@/lib/db";
import { historyItem } from "@/lib/records";
import { audit, json, noContent, pageResult, pagination, requireUser, route } from "@/lib/server";

const VERDICT_LEVEL = { safe: "low", suspicious: "medium", scam: "high" };

export const GET = route(async request => {
  const profile = await requireUser();
  const { searchParams } = new URL(request.url);
  const paging = pagination(searchParams);
  const conditions = ["user_id = $1"];
  const values = [profile.id];
  const kind = searchParams.get("kind");
  if (["message", "url", "sender"].includes(kind)) { values.push(kind); conditions.push(`kind = $${values.length}`); }
  const level = VERDICT_LEVEL[searchParams.get("verdict")];
  if (level) { values.push(level); conditions.push(`risk_level = $${values.length}`); }
  const query = (searchParams.get("q") || "").trim().slice(0, 200);
  if (query) {
    values.push(`%${query.replace(/[\\%_]/g, match => `\\${match}`)}%`);
    conditions.push(`(message ilike $${values.length} or scam_type ilike $${values.length})`);
  }
  const order = searchParams.get("sort") === "oldest" ? "asc" : "desc";
  const where = conditions.join(" and ");
  const total = Number((await pool.query(`select count(*) from scam_cases where ${where}`, values)).rows[0].count);
  const rows = await pool.query(
    `select * from scam_cases where ${where} order by created_at ${order}, id ${order} limit ${paging.pageSize} offset ${paging.offset}`,
    values
  );
  return json(pageResult(rows.rows.map(row => historyItem(row)), total, paging));
});

export const DELETE = route(async () => {
  const profile = await requireUser();
  const result = await pool.query("delete from scam_cases where user_id = $1", [profile.id]);
  await audit("history_cleared", { userId: profile.id, actorId: profile.id, details: { count: result.rowCount } });
  return noContent();
});
