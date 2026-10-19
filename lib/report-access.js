import { pool } from "./db";
import { reportItem, REPORT_STATUSES } from "./records";
import { authenticate, HttpError, positiveId } from "./server";

// Loads a report the current user may see: their own, or any report for administrators.
export async function loadAccessibleReport(rawId) {
  const profile = await authenticate();
  const id = positiveId(rawId);
  const result = await pool.query(
    `select r.*, p.email as reporter_email, p.display_name as reporter_name
       from scam_reports r join profiles p on p.id = r.user_id where r.id = $1`,
    [id]
  );
  const report = result.rows[0];
  // Same response whether the report is missing or belongs to someone else, so IDs can't be probed.
  if (!report || (profile.role !== "admin" && String(report.user_id) !== String(profile.id))) throw new HttpError(404, "Report not found.");
  return { profile, report };
}

export async function reportDetail(report, profile) {
  const [updates, evidence] = await Promise.all([
    pool.query(
      `select u.id, u.kind, u.from_status, u.to_status, u.note, u.created_at, p.role as author_role
         from report_updates u left join profiles p on p.id = u.author_id where u.report_id = $1 order by u.created_at, u.id`,
      [report.id]
    ),
    pool.query("select id, file_name, mime_type, size_bytes, created_at from report_evidence where report_id = $1 order by id", [report.id])
  ]);
  const item = reportItem(report);
  if (profile.role !== "admin") { delete item.reporter_email; delete item.reporter_name; }
  return {
    ...item,
    can_add_info: profile.role !== "admin" && ["submitted", "under_review"].includes(report.status),
    timeline: updates.rows.map(update => ({
      id: update.id,
      kind: update.kind,
      from_status: update.from_status,
      to_status: update.to_status,
      to_status_label: REPORT_STATUSES[update.to_status] || null,
      note: update.note,
      by: update.author_role === "admin" ? "Administrator" : update.author_role ? "You" : "System",
      created_at: update.created_at
    })),
    evidence: evidence.rows.map(file => ({ id: file.id, file_name: file.file_name, mime_type: file.mime_type, size_bytes: file.size_bytes, created_at: file.created_at }))
  };
}
