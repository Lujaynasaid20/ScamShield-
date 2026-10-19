import { pool } from "@/lib/db";
import { loadAccessibleReport } from "@/lib/report-access";
import { audit, HttpError, positiveId, route } from "@/lib/server";

// Evidence is only served to the reporter and administrators, always as a download in a locked-down response.
export const GET = route(async (request, { params }) => {
  const { id, evidenceId } = await params;
  const { profile, report } = await loadAccessibleReport(id);
  const result = await pool.query("select file_name, mime_type, data from report_evidence where id = $1 and report_id = $2", [positiveId(evidenceId), report.id]);
  const file = result.rows[0];
  if (!file) throw new HttpError(404, "File not found.");
  if (profile.role === "admin") await audit("evidence_viewed", { userId: report.user_id, actorId: profile.id, details: { report_id: report.id, evidence_id: evidenceId } });
  const safeName = file.file_name.replace(/[^\w.\- ]+/g, "_");
  return new Response(file.data, {
    headers: {
      "Content-Type": file.mime_type === "text/plain" ? "text/plain; charset=utf-8" : file.mime_type,
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, no-store"
    }
  });
});
