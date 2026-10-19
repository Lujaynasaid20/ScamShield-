import { pool } from "@/lib/db";
import { insertEvidence, readEvidenceFiles, readReportRequest } from "@/lib/records";
import { loadAccessibleReport, reportDetail } from "@/lib/report-access";
import { HttpError, json, rateLimit, route, text } from "@/lib/server";

// The reporter adds more information while the report is still open.
export const POST = route(async (request, { params }) => {
  const { profile, report } = await loadAccessibleReport((await params).id);
  if (String(report.user_id) !== String(profile.id)) throw new HttpError(403, "Only the reporter can add information to this report.");
  if (!["submitted", "under_review"].includes(report.status)) throw new HttpError(409, "This report is closed, so no more information can be added.");
  rateLimit(`report-note:${profile.id}`, 20, 60 * 60 * 1000);

  const { fields, formData } = await readReportRequest(request);
  const note = text(fields.note, { max: 2000, field: "Additional information" });
  const existing = Number((await pool.query("select count(*) from report_evidence where report_id = $1", [report.id])).rows[0].count);
  const evidence = await readEvidenceFiles(formData, existing);
  if (!note && !evidence.length) throw new HttpError(400, "Add a note or attach a file.");

  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      "insert into report_updates (report_id, author_id, kind, note) values ($1, $2, 'user_note', $3)",
      [report.id, profile.id, note || `Attached ${evidence.length} file${evidence.length === 1 ? "" : "s"}.`]
    );
    await insertEvidence(client, report.id, profile.id, evidence);
    await client.query("update scam_reports set updated_at = now() where id = $1", [report.id]);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
  return json({ item: await reportDetail(report, profile) }, 201);
});
