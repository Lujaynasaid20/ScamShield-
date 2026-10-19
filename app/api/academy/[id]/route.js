import { getModule, gradeQuiz, PASS_MARK } from "@/lib/academy";
import { pool } from "@/lib/db";
import { HttpError, json, rateLimit, readBody, requireUser, route } from "@/lib/server";

async function loadModule(params) {
  const profile = await requireUser();
  const module = getModule(String((await params).id));
  if (!module) throw new HttpError(404, "Lesson not found.");
  return { profile, module };
}

const progressView = row => row ? {
  lesson_completed: Boolean(row.lesson_completed_at),
  quiz_score: row.quiz_score,
  best_score: row.best_score,
  attempts: row.attempts,
  completed: Boolean(row.completed_at),
  completed_at: row.completed_at
} : { lesson_completed: false, quiz_score: null, best_score: null, attempts: 0, completed: false, completed_at: null };

export const GET = route(async (request, { params }) => {
  const { profile, module } = await loadModule(params);
  const row = (await pool.query("select * from learning_progress where user_id = $1 and module_id = $2", [profile.id, module.id])).rows[0];
  return json({ module, passMark: PASS_MARK, progress: progressView(row) });
});

// action "lesson" marks the lesson read; action "quiz" grades answers on the server and stores the result.
export const POST = route(async (request, { params }) => {
  const { profile, module } = await loadModule(params);
  const body = await readBody(request);
  if (body.action === "lesson") {
    const row = (await pool.query(
      `insert into learning_progress (user_id, module_id, lesson_completed_at) values ($1, $2, now())
       on conflict (user_id, module_id) do update set lesson_completed_at = coalesce(learning_progress.lesson_completed_at, now()), updated_at = now()
       returning *`,
      [profile.id, module.id]
    )).rows[0];
    return json({ progress: progressView(row) });
  }
  if (body.action === "quiz") {
    rateLimit(`quiz:${profile.id}`, 30, 60 * 1000);
    const grade = gradeQuiz(module, body.answers);
    if (!grade) throw new HttpError(400, "Answer every question before submitting.");
    const row = (await pool.query(
      `insert into learning_progress (user_id, module_id, quiz_score, quiz_total, best_score, attempts, completed_at)
       values ($1, $2, $3, $4, $3, 1, case when $5 then now() end)
       on conflict (user_id, module_id) do update set
         quiz_score = $3, quiz_total = $4,
         best_score = greatest(coalesce(learning_progress.best_score, 0), $3),
         attempts = learning_progress.attempts + 1,
         completed_at = coalesce(learning_progress.completed_at, case when $5 then now() end),
         updated_at = now()
       returning *`,
      [profile.id, module.id, grade.score, grade.total, grade.passed]
    )).rows[0];
    return json({ grade, progress: progressView(row) });
  }
  throw new HttpError(400, "Unknown action.");
});
