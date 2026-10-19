import { MODULES } from "@/lib/academy";
import { pool } from "@/lib/db";
import { json, requireUser, route } from "@/lib/server";

export const GET = route(async () => {
  const profile = await requireUser();
  const progress = await pool.query("select * from learning_progress where user_id = $1", [profile.id]);
  const byModule = Object.fromEntries(progress.rows.map(row => [row.module_id, row]));
  const modules = MODULES.map(module => {
    const row = byModule[module.id];
    return {
      id: module.id, icon: module.icon, title: module.title, summary: module.summary, minutes: module.minutes,
      lesson_completed: Boolean(row?.lesson_completed_at),
      best_score: row?.best_score ?? null,
      quiz_total: module.quiz.length,
      completed: Boolean(row?.completed_at)
    };
  });
  return json({ modules, completed: modules.filter(module => module.completed).length, total: modules.length });
});
