import { pool } from "@/lib/db";
import { insertEvidence, readEvidenceFiles, readReportRequest, REPORT_CATEGORIES, REPORT_STATUSES, reportItem } from "@/lib/records";
import { analyzePhone } from "@/lib/phone";
import { normalizeSender } from "@/lib/sender";
import { HttpError, json, pageResult, pagination, rateLimit, requireUser, route, text } from "@/lib/server";
import { parseUrlInput } from "@/lib/url-scan";

export const GET = route(async request => {
  const profile = await requireUser();
  const { searchParams } = new URL(request.url);
  const paging = pagination(searchParams);
  const values = [profile.id];
  let where = "r.user_id = $1";
  const status = searchParams.get("status");
  if (REPORT_STATUSES[status]) { values.push(status); where += ` and r.status = $${values.length}`; }
  const total = Number((await pool.query(`select count(*) from scam_reports r where ${where}`, values)).rows[0].count);
  const rows = await pool.query(
    `select r.*, (select count(*) from report_evidence e where e.report_id = r.id) as evidence_count
       from scam_reports r where ${where} order by r.created_at desc limit ${paging.pageSize} offset ${paging.offset}`,
    values
  );
  return json(pageResult(rows.rows.map(reportItem), total, paging));
});

export const POST = route(async request => {
  const profile = await requireUser();
  rateLimit(`report:${profile.id}`, 10, 60 * 60 * 1000, "You've submitted many reports recently. Please try again later.");
  const { fields, formData } = await readReportRequest(request);

  const category = text(fields.category ?? fields.scam_type, { max: 120, required: true, field: "Scam category" });
  if (!REPORT_CATEGORIES.includes(category)) throw new HttpError(400, "Choose a scam category from the list.");
  const details = text(fields.details, { max: 2000, required: true, field: "Description" });
  const messageText = text(fields.message_text, { max: 5000, field: "Suspicious message" }) || null;
  let url = text(fields.url, { max: 2048, field: "URL" }) || null;
  if (url) {
    const parsed = parseUrlInput(url);
    if (parsed.error) throw new HttpError(400, `URL: ${parsed.error}`);
  }
  let senderType = null, senderValue = null, senderNormalized = null, senderE164 = null;
  const rawSender = text(fields.sender_value, { max: 200, field: "Sender" });
  if (rawSender) {
    const sender = normalizeSender(rawSender, fields.sender_type);
    if (!sender.valid) throw new HttpError(400, `Sender: ${sender.error}`);
    senderType = sender.type; senderValue = sender.display; senderNormalized = sender.normalized;
    if (sender.type === "phone") {
      const phone = analyzePhone(sender.value);
      if (phone.status === "valid") { senderE164 = phone.e164; senderValue = phone.formatted; }
    }
  }
  const claimedIdentity = text(fields.claimed_identity, { max: 120, field: "Name the sender claimed" }).replace(/\s+/g, " ") || null;
  let caseId = fields.case_id ? String(fields.case_id) : null;
  if (caseId) {
    if (!/^\d{1,18}$/.test(caseId)) throw new HttpError(400, "The linked analysis is invalid.");
    const owned = await pool.query("select id from scam_cases where id = $1 and user_id = $2", [caseId, profile.id]);
    if (!owned.rowCount) throw new HttpError(400, "The linked analysis does not belong to your account.");
  }
  const evidence = await readEvidenceFiles(formData);

  const duplicate = await pool.query(
    "select id from scam_reports where user_id = $1 and details = $2 and created_at > now() - interval '10 minutes' limit 1",
    [profile.id, details]
  );
  if (duplicate.rowCount) throw new HttpError(409, "You already submitted this report a moment ago.", { report_id: duplicate.rows[0].id });

  const client = await pool.connect();
  try {
    await client.query("begin");
    const inserted = await client.query(
      `insert into scam_reports (user_id, case_id, scam_type, details, message_text, url, sender_type, sender_value, sender_normalized, sender_e164, claimed_identity)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning *`,
      [profile.id, caseId, category, details, messageText, url, senderType, senderValue, senderNormalized, senderE164, claimedIdentity]
    );
    const report = inserted.rows[0];
    await client.query("insert into report_updates (report_id, author_id, kind, to_status) values ($1, $2, 'created', 'submitted')", [report.id, profile.id]);
    await insertEvidence(client, report.id, profile.id, evidence);
    await client.query("commit");
    return json({ item: { ...reportItem(report), evidence_count: evidence.length } }, 201);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
});
