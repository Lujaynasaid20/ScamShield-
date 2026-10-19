import { pool } from "@/lib/db";
import { historyItem } from "@/lib/records";
import { json, pageResult, pagination, requireAdmin, route } from "@/lib/server";

const VERDICT_LEVEL = { safe: "low", suspicious: "medium", scam: "high" };

// All analyzed cases across accounts (admin "Scam database").
export const GET = route(async request => {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const paging = pagination(searchParams);
  const conditions = [];
  const values = [];
  const kind = searchParams.get("kind");
  if (["message", "url", "sender"].includes(kind)) { values.push(kind); conditions.push(`c.kind = $${values.length}`); }
  const level = VERDICT_LEVEL[searchParams.get("verdict")];
  if (level) { values.push(level); conditions.push(`c.risk_level = $${values.length}`); }
  const query = (searchParams.get("q") || "").trim().slice(0, 200);
  if (query) {
    values.push(`%${query.replace(/[\\%_]/g, match => `\\${match}`)}%`);
    conditions.push(`(c.message ilike $${values.length} or p.email ilike $${values.length})`);
  }
  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  const from = "from scam_cases c join profiles p on p.id = c.user_id";
  const total = Number((await pool.query(`select count(*) ${from} ${where}`, values)).rows[0].count);
  const rows = await pool.query(`select c.*, p.email as owner_email ${from} ${where} order by c.created_at desc limit ${paging.pageSize} offset ${paging.offset}`, values);
  return json(pageResult(rows.rows.map(row => ({ ...historyItem(row), owner_email: row.owner_email })), total, paging));
});
