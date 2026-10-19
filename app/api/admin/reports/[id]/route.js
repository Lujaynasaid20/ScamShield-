import { pool } from "@/lib/db";
import { notify } from "@/lib/notify";
import { REPORT_STATUSES } from "@/lib/records";
import { loadAccessibleReport, reportDetail } from "@/lib/report-access";
import { audit, HttpError, json, readBody, requireAdmin, route, text } from "@/lib/server";

// Administrators change a report's status and/or leave feedback for the reporter.
export const PATCH = route(async (request, { params }) => {
  const admin = await requireAdmin();
  const { report } = await loadAccessibleReport((await params).id);
  const body = await readBody(request);
  const status = body.status === undefined ? report.status : body.status;
  if (!REPORT_STATUSES[status]) throw new HttpError(400, "Report status is invalid.");
  const feedback = text(body.feedback, { max: 2000, field: "Feedback" });
  const statusChanged = status !== report.status;
  if (!statusChanged && !feedback) throw new HttpError(400, "Change the status or write feedback.");

  const client = await pool.connect();
  let updated;
  try {
    await client.query("begin");
    updated = (await client.query(
      "update scam_reports set status = $1, admin_feedback = coalesce($2, admin_feedback), updated_at = now() where id = $3 returning *",
      [status, feedback || null, report.id]
    )).rows[0];
    await client.query(
      "insert into report_updates (report_id, author_id, kind, from_status, to_status, note) values ($1, $2, $3, $4, $5, $6)",
      [report.id, admin.id, statusChanged ? "status" : "feedback", statusChanged ? report.status : null, statusChanged ? status : null, feedback || null]
    );
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  await audit("report_status_changed", { userId: report.user_id, actorId: admin.id, details: { report_id: report.id, from: report.status, to: status, feedback: Boolean(feedback) } });
  await notify(report.user_id, "report_status", {
    title: statusChanged ? `Your report #${report.id} is now ${REPORT_STATUSES[status]}` : `An administrator replied to your report #${report.id}`,
    body: feedback || `Category: ${report.scam_type}`,
    link: `/reports/${report.id}`
  });
  return json({ item: await reportDetail({ ...updated, reporter_email: report.reporter_email, reporter_name: report.reporter_name }, admin) });
});
