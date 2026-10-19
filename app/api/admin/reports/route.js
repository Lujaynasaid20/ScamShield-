import { pool } from "@/lib/db";
import { REPORT_STATUSES, reportItem } from "@/lib/records";
import { json, pageResult, pagination, requireAdmin, route } from "@/lib/server";

export const GET = route(async request => {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const paging = pagination(searchParams);
  const conditions = [];
  const values = [];
  const status = searchParams.get("status");
  if (status === "open") conditions.push("r.status in ('submitted', 'under_review')");
  else if (REPORT_STATUSES[status]) { values.push(status); conditions.push(`r.status = $${values.length}`); }
  const query = (searchParams.get("q") || "").trim().slice(0, 200);
  if (query) {
    values.push(`%${query.replace(/[\\%_]/g, match => `\\${match}`)}%`);
    conditions.push(`(r.details ilike $${values.length} or r.scam_type ilike $${values.length} or r.sender_value ilike $${values.length} or r.url ilike $${values.length} or p.email ilike $${values.length})`);
  }
  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  const from = "from scam_reports r join profiles p on p.id = r.user_id";
  const total = Number((await pool.query(`select count(*) ${from} ${where}`, values)).rows[0].count);
  const rows = await pool.query(
    `select r.*, p.email as reporter_email, p.display_name as reporter_name,
            (select count(*) from report_evidence e where e.report_id = r.id) as evidence_count
       ${from} ${where} order by r.created_at desc limit ${paging.pageSize} offset ${paging.offset}`,
    values
  );
  return json(pageResult(rows.rows.map(reportItem), total, paging));
});
