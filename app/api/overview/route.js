import { getModule, MODULES } from "@/lib/academy";
import { categoryLabel } from "@/lib/analyzer";
import { pool } from "@/lib/db";
import { CATEGORY_MODULE, historyItem } from "@/lib/records";
import { json, requireUser, route } from "@/lib/server";

export const GET = route(async () => {
  const profile = await requireUser();
  const [totalsResult, reportsResult, recentResult, categoriesResult, dailyResult, academyResult] = await Promise.all([
    pool.query(
      `select count(*) filter (where kind = 'message') as messages,
              count(*) filter (where kind = 'message' and risk_level = 'high') as scam,
              count(*) filter (where kind = 'message' and risk_level = 'medium') as suspicious,
              count(*) filter (where kind = 'message' and risk_level = 'low') as safe,
              count(*) filter (where kind = 'url') as urls,
              count(*) filter (where kind = 'url' and risk_level <> 'low') as risky_urls,
              count(*) filter (where kind = 'sender') as senders
         from scam_cases where user_id = $1`,
      [profile.id]
    ),
    pool.query("select count(*) as total, count(*) filter (where status in ('submitted', 'under_review')) as open from scam_reports where user_id = $1", [profile.id]),
    pool.query("select * from scam_cases where user_id = $1 order by created_at desc limit 6", [profile.id]),
    pool.query(
      `select scam_type, count(*)::int as count from scam_cases
        where user_id = $1 and kind = 'message' and risk_level <> 'low' group by scam_type order by count desc limit 5`,
      [profile.id]
    ),
    pool.query(
      `select to_char(day, 'YYYY-MM-DD') as day,
              count(c.id) filter (where c.risk_level = 'high')::int as scam,
              count(c.id) filter (where c.risk_level = 'medium')::int as suspicious,
              count(c.id) filter (where c.risk_level = 'low')::int as safe
         from generate_series(current_date - 13, current_date, interval '1 day') as day
         left join scam_cases c on c.user_id = $1 and c.created_at >= day and c.created_at < day + interval '1 day'
        group by day order by day`,
      [profile.id]
    ),
    pool.query("select count(*) filter (where completed_at is not null)::int as completed from learning_progress where user_id = $1", [profile.id])
  ]);

  const totals = Object.fromEntries(Object.entries(totalsResult.rows[0]).map(([key, value]) => [key, Number(value)]));
  const reports = { total: Number(reportsResult.rows[0].total), open: Number(reportsResult.rows[0].open) };
  const categories = categoriesResult.rows.map(row => ({ category: row.scam_type, label: categoryLabel(row.scam_type), count: row.count }));
  const academyCompleted = academyResult.rows[0].completed;

  // Personalized recommendations derived from this user's own records.
  const recommendations = [];
  if (!totals.messages && !totals.urls && !totals.senders) {
    recommendations.push({ icon: "bi-activity", title: "Check your first suspicious message", body: "Paste any message that feels off to see its warning signs explained.", href: "/analyze", action: "Analyze a message" });
  }
  if (categories[0]) {
    const module = getModule(CATEGORY_MODULE[categories[0].category]);
    if (module) recommendations.push({ icon: module.icon, title: `Learn about ${categories[0].label.toLowerCase()}`, body: `This is the most common risky category in your history (${categories[0].count} message${categories[0].count === 1 ? "" : "s"}).`, href: `/academy/${module.id}`, action: "Start the lesson" });
  }
  if (!profile.totp_enabled) {
    recommendations.push({ icon: "bi-shield-lock", title: "Turn on two-factor authentication", body: "A one-time code from an authenticator app stops someone who learns your password from signing in.", href: "/settings#security", action: "Set up 2FA" });
  }
  if (totals.scam > 0 && reports.total === 0) {
    recommendations.push({ icon: "bi-flag", title: "Report scams you've found", body: `You've detected ${totals.scam} likely scam message${totals.scam === 1 ? "" : "s"}. Reporting them helps warn other users.`, href: "/reports/new", action: "Report a scam" });
  }
  if (totals.urls === 0) {
    recommendations.push({ icon: "bi-link-45deg", title: "Scan links before you open them", body: "The URL Scanner checks a link's address for warning signs without opening it.", href: "/urls", action: "Scan a link" });
  }
  if (academyCompleted < MODULES.length) {
    recommendations.push({ icon: "bi-mortarboard", title: "Keep learning", body: `You've completed ${academyCompleted} of ${MODULES.length} academy modules.`, href: "/academy", action: "Open the academy" });
  }

  return json({
    totals,
    reports,
    recent: recentResult.rows.map(row => historyItem(row)),
    categories,
    daily: dailyResult.rows,
    academy: { completed: academyCompleted, total: MODULES.length },
    twoFactor: Boolean(profile.totp_enabled),
    recommendations: recommendations.slice(0, 4)
  });
});
