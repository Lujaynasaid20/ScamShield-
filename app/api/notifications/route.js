import { pool } from "@/lib/db";
import { authenticate, json, pageResult, pagination, readBody, route } from "@/lib/server";

export const GET = route(async request => {
  const profile = await authenticate();
  const { searchParams } = new URL(request.url);
  const unreadCount = Number((await pool.query("select count(*) from notifications where user_id = $1 and read_at is null", [profile.id])).rows[0].count);
  if (searchParams.get("countOnly") === "1") return json({ unread: unreadCount });
  const paging = pagination(searchParams, { defaultSize: 15 });
  const unreadOnly = searchParams.get("filter") === "unread";
  const where = `user_id = $1${unreadOnly ? " and read_at is null" : ""}`;
  const total = Number((await pool.query(`select count(*) from notifications where ${where}`, [profile.id])).rows[0].count);
  const rows = await pool.query(
    `select id, type, title, body, link, read_at, created_at from notifications where ${where} order by created_at desc, id desc limit ${paging.pageSize} offset ${paging.offset}`,
    [profile.id]
  );
  return json({ ...pageResult(rows.rows, total, paging), unread: unreadCount });
});

// Marks notifications as read: { all: true } or { ids: [...] }. { unread: true } marks them unread again.
export const PATCH = route(async request => {
  const profile = await authenticate();
  const body = await readBody(request);
  const readValue = body.unread === true ? null : new Date();
  if (body.all === true) {
    await pool.query("update notifications set read_at = $2 where user_id = $1 and read_at is null", [profile.id, readValue]);
  } else {
    const ids = (Array.isArray(body.ids) ? body.ids : []).map(String).filter(id => /^\d{1,18}$/.test(id)).slice(0, 100);
    if (ids.length) await pool.query("update notifications set read_at = $3 where user_id = $1 and id = any($2::bigint[])", [profile.id, ids, readValue]);
  }
  const unread = Number((await pool.query("select count(*) from notifications where user_id = $1 and read_at is null", [profile.id])).rows[0].count);
  return json({ unread });
});
