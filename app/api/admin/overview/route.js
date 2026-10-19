import { categoryLabel } from "@/lib/analyzer";
import { pool } from "@/lib/db";
import { reportItem } from "@/lib/records";
import { json, requireAdmin, route } from "@/lib/server";

export const GET = route(async () => {
  await requireAdmin();
  const [users, analyses, reportStatus, reportCategories, analysisCategories, daily, recentReports, alerts] = await Promise.all([
    pool.query("select count(*) filter (where role = 'user')::int as users, count(*) filter (where role = 'admin')::int as admins, count(*) filter (where created_at > now() - interval '7 days')::int as new_this_week from profiles"),
    pool.query(
      `select count(*) filter (where kind = 'message')::int as messages,
              count(*) filter (where kind = 'message' and risk_level = 'high')::int as scam,
              count(*) filter (where kind = 'message' and risk_level = 'medium')::int as suspicious,
              count(*) filter (where kind = 'message' and risk_level = 'low')::int as safe,
              count(*) filter (where kind = 'url')::int as urls,
              count(*) filter (where kind = 'url' and risk_level = 'high')::int as urls_high,
              count(*) filter (where kind = 'url' and risk_level = 'medium')::int as urls_medium,
              count(*) filter (where kind = 'url' and details->'reputation'->>'status' = 'match')::int as urls_listed,
              count(*) filter (where kind = 'sender')::int as senders
         from scam_cases`
    ),
    pool.query("select status, count(*)::int as count from scam_reports group by status"),
    pool.query("select scam_type as category, count(*)::int as count from scam_reports group by scam_type order by count desc limit 8"),
    pool.query("select scam_type, count(*)::int as count from scam_cases where kind = 'message' and risk_level <> 'low' group by scam_type order by count desc limit 8"),
    pool.query(
      `select to_char(day, 'YYYY-MM-DD') as day,
              count(c.id) filter (where c.risk_level = 'high')::int as scam,
              count(c.id) filter (where c.risk_level = 'medium')::int as suspicious,
              count(c.id) filter (where c.risk_level = 'low')::int as safe
         from generate_series(current_date - 13, current_date, interval '1 day') as day
         left join scam_cases c on c.created_at >= day and c.created_at < day + interval '1 day'
        group by day order by day`
    ),
    pool.query("select r.*, p.email as reporter_email, p.display_name as reporter_name from scam_reports r join profiles p on p.id = r.user_id order by r.created_at desc limit 5"),
    pool.query("select count(*)::int as count from scam_alerts")
  ]);
  const statusCounts = { submitted: 0, under_review: 0, verified: 0, rejected: 0, resolved: 0 };
  for (const row of reportStatus.rows) statusCounts[row.status] = row.count;
  const decided = statusCounts.verified + statusCounts.rejected;
  return json({
    users: users.rows[0],
    analyses: analyses.rows[0],
    reports: { ...statusCounts, total: Object.values(statusCounts).reduce((sum, value) => sum + value, 0), open: statusCounts.submitted + statusCounts.under_review },
    outcomes: { decided, verifiedRate: decided ? Math.round((statusCounts.verified / decided) * 100) : null },
    reportCategories: reportCategories.rows,
    detectionCategories: analysisCategories.rows.map(row => ({ category: row.scam_type, label: categoryLabel(row.scam_type), count: row.count })),
    daily: daily.rows,
    recentReports: recentReports.rows.map(reportItem),
    alerts: alerts.rows[0].count
  });
});
