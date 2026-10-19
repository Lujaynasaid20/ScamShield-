import { pool } from "@/lib/db";
import { broadcastThreatAlert } from "@/lib/notify";
import { audit, HttpError, json, readBody, requireAdmin, route, text } from "@/lib/server";

export const GET = route(async () => {
  await requireAdmin();
  const rows = await pool.query("select a.id, a.title, a.body, a.category, a.report_id, a.created_at, p.display_name as author from scam_alerts a left join profiles p on p.id = a.author_id order by a.created_at desc limit 20");
  return json({ items: rows.rows });
});

// Publishes a confirmed scam pattern. It must be based on a verified report, so alerts reflect real, reviewed events.
export const POST = route(async request => {
  const admin = await requireAdmin();
  const body = await readBody(request);
  const title = text(body.title, { max: 200, required: true, field: "Title" });
  const message = text(body.body, { max: 2000, required: true, field: "Alert text" });
  if (title.length < 3 || message.length < 3) throw new HttpError(400, "Write a title and alert text.");
  const reportId = String(body.report_id || "");
  if (!/^\d{1,18}$/.test(reportId)) throw new HttpError(400, "Choose the verified report this alert is based on.");
  const report = (await pool.query("select id, scam_type, status from scam_reports where id = $1", [reportId])).rows[0];
  if (!report) throw new HttpError(404, "Report not found.");
  if (!["verified", "resolved"].includes(report.status)) throw new HttpError(409, "Alerts can only be published from a verified report.");

  const alert = (await pool.query(
    "insert into scam_alerts (author_id, report_id, title, body, category) values ($1, $2, $3, $4, $5) returning *",
    [admin.id, report.id, title, message, report.scam_type]
  )).rows[0];
  const recipients = await broadcastThreatAlert({ title: `Confirmed scam alert: ${title}`, body: message, link: "/notifications" });
  await audit("scam_alert_published", { actorId: admin.id, details: { alert_id: alert.id, report_id: report.id, recipients } });
  return json({ item: alert, recipients }, 201);
});
