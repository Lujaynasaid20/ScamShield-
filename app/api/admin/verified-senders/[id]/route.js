import { pool } from "@/lib/db";
import { audit, HttpError, noContent, positiveId, requireAdmin, route } from "@/lib/server";

export const DELETE = route(async (request, { params }) => {
  const admin = await requireAdmin();
  const id = positiveId((await params).id);
  const deleted = await pool.query("delete from verified_senders where id = $1 returning sender_type, display_value, business_name", [id]);
  if (!deleted.rowCount) throw new HttpError(404, "This directory entry was not found.");
  await audit("verified_sender_removed", { actorId: admin.id, details: { id, ...deleted.rows[0] } });
  return noContent();
});
