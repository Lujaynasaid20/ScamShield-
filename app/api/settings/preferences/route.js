import { pool } from "@/lib/db";
import { getPreferences } from "@/lib/notify";
import { authenticate, json, readBody, route } from "@/lib/server";

const FIELDS = ["notify_analysis", "notify_report_status", "notify_education", "notify_threat_alerts", "notify_security"];
const view = preferences => Object.fromEntries(FIELDS.map(field => [field, Boolean(preferences[field])]));

export const GET = route(async () => {
  const profile = await authenticate();
  return json({ preferences: view(await getPreferences(profile.id)) });
});

export const PUT = route(async request => {
  const profile = await authenticate();
  const body = await readBody(request);
  const next = { ...view(await getPreferences(profile.id)) };
  for (const field of FIELDS) if (typeof body[field] === "boolean") next[field] = body[field];
  await pool.query(
    `insert into user_preferences (user_id, ${FIELDS.join(", ")}, updated_at) values ($1, $2, $3, $4, $5, $6, now())
     on conflict (user_id) do update set ${FIELDS.map((field, index) => `${field} = $${index + 2}`).join(", ")}, updated_at = now()`,
    [profile.id, ...FIELDS.map(field => next[field])]
  );
  return json({ preferences: next });
});
