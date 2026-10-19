import { pool } from "@/lib/db";
import { json, pageResult, pagination, requireAdmin, route } from "@/lib/server";

export const GET = route(async request => {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const paging = pagination(searchParams, { defaultSize: 20 });
  const values = [];
  let where = "";
  const query = (searchParams.get("q") || "").trim().slice(0, 200);
  if (query) {
    values.push(`%${query.replace(/[\\%_]/g, match => `\\${match}`)}%`);
    where = "where p.email ilike $1 or p.display_name ilike $1";
  }
  const total = Number((await pool.query(`select count(*) from profiles p ${where}`, values)).rows[0].count);
  const rows = await pool.query(
    `select p.id, p.email, p.display_name, p.role, p.totp_enabled, p.created_at,
            (select count(*) from scam_cases c where c.user_id = p.id)::int as analyses,
            (select count(*) from scam_reports r where r.user_id = p.id)::int as reports
       from profiles p ${where} order by p.created_at desc limit ${paging.pageSize} offset ${paging.offset}`,
    values
  );
  return json(pageResult(rows.rows, total, paging));
});
