import { pool } from "@/lib/db";
import { analyzePhone } from "@/lib/phone";
import { normalizeSender } from "@/lib/sender";
import { audit, HttpError, json, pageResult, pagination, readBody, requireAdmin, route, text } from "@/lib/server";

const item = row => ({ id: row.id, type: row.sender_type, value: row.display_value, business_name: row.business_name, source: row.source, added_by: row.added_by_name || null, created_at: row.created_at });

export const GET = route(async request => {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const paging = pagination(searchParams, { defaultSize: 20 });
  const values = [];
  let where = "";
  const query = (searchParams.get("q") || "").trim().slice(0, 200);
  if (query) {
    values.push(`%${query.replace(/[\%_]/g, match => `\${match}`)}%`);
    where = `where v.business_name ilike $1 or v.display_value ilike $1 or v.match_key ilike $1`;
  }
  const total = Number((await pool.query(`select count(*) from verified_senders v ${where}`, values)).rows[0].count);
  const rows = await pool.query(
    `select v.*, p.display_name as added_by_name from verified_senders v left join profiles p on p.id = v.added_by
      ${where} order by v.business_name, v.created_at desc limit ${paging.pageSize} offset ${paging.offset}`,
    values
  );
  return json(pageResult(rows.rows.map(item), total, paging));
});

// Adds an official business contact. The source must say where the admin confirmed it (e.g. the business's own website).
export const POST = route(async request => {
  const admin = await requireAdmin();
  const body = await readBody(request);
  const type = body.type === "email" ? "email" : body.type === "phone" ? "phone" : null;
  if (!type) throw new HttpError(400, "Choose phone number or email address.");
  const rawValue = text(body.value, { max: 200, required: true, field: type === "phone" ? "Phone number" : "Email address" });
  const businessName = text(body.business_name, { max: 120, required: true, field: "Business name" }).replace(/\s+/g, " ");
  const source = text(body.source, { max: 300, required: true, field: "Verification source" });
  if (businessName.length < 2) throw new HttpError(400, "Business name must be at least 2 characters.");
  if (source.length < 3) throw new HttpError(400, "Say where you confirmed this contact, such as the business's official website.");

  let matchKey, displayValue;
  if (type === "phone") {
    const phone = analyzePhone(rawValue);
    if (phone.status !== "valid") throw new HttpError(400, phone.status === "no_country_code" || phone.status === "short_code" ? "Enter the full number with its country code, like +255 754 123 456." : `That isn't a valid phone number${phone.countryName ? ` for ${phone.countryName}` : ""}.`);
    matchKey = phone.e164; displayValue = phone.formatted;
  } else {
    const sender = normalizeSender(rawValue, "email");
    if (!sender.valid) throw new HttpError(400, sender.error);
    matchKey = sender.normalized; displayValue = sender.display;
  }

  try {
    const inserted = await pool.query(
      `insert into verified_senders (sender_type, match_key, display_value, business_name, source, added_by)
       values ($1, $2, $3, $4, $5, $6) returning *`,
      [type, matchKey, displayValue, businessName, source, admin.id]
    );
    await audit("verified_sender_added", { actorId: admin.id, details: { id: inserted.rows[0].id, type, value: displayValue, business_name: businessName } });
    return json({ item: item(inserted.rows[0]) }, 201);
  } catch (error) {
    if (error.code === "23505") throw new HttpError(409, "This contact is already in the directory.");
    throw error;
  }
});
