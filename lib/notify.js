import { pool } from "./db";

const PREFERENCE_COLUMN = {
  analysis: "notify_analysis",
  report_status: "notify_report_status",
  education: "notify_education",
  threat_alert: "notify_threat_alerts",
  security: "notify_security"
};

const DEFAULTS = { notify_analysis: false, notify_report_status: true, notify_education: true, notify_threat_alerts: true, notify_security: true };

export async function getPreferences(userId, db = pool) {
  const result = await db.query("select * from user_preferences where user_id = $1", [userId]);
  return { ...DEFAULTS, ...(result.rows[0] || {}) };
}

// Creates a notification if the user's preferences allow this type.
export async function notify(userId, type, { title, body = "", link = null }, db = pool) {
  const column = PREFERENCE_COLUMN[type];
  const preferences = await getPreferences(userId, db);
  if (!preferences[column]) return false;
  await db.query("insert into notifications (user_id, type, title, body, link) values ($1, $2, $3, $4, $5)", [userId, type, title.slice(0, 200), body.slice(0, 2000), link]);
  return true;
}

// Sends an administrator-confirmed scam alert to every user who has threat alerts enabled.
export async function broadcastThreatAlert({ title, body, link }, db = pool) {
  const result = await db.query(
    `insert into notifications (user_id, type, title, body, link)
     select p.id, 'threat_alert', $1, $2, $3
       from profiles p left join user_preferences up on up.user_id = p.id
      where p.role = 'user' and coalesce(up.notify_threat_alerts, true)`,
    [title.slice(0, 200), body.slice(0, 2000), link]
  );
  return result.rowCount;
}
