import { pool } from "@/lib/db";

// Reports whether the database is reachable and migrated. Never includes connection details.
export async function GET() {
  try {
    const result = await pool.query(
      "select to_regclass('public.profiles') is not null and to_regclass('public.user_sessions') is not null and to_regclass('public.user_preferences') is not null as ready"
    );
    const schemaReady = result.rows[0].ready;
    return Response.json(
      { ok: schemaReady, database: "connected", schema: schemaReady ? "ready" : "missing tables - run npm run migrate" },
      { status: schemaReady ? 200 : 503 }
    );
  } catch (error) {
    console.error("Health check failed", error.code || error.message);
    return Response.json({ ok: false, database: "unreachable", code: error.code || null }, { status: 503 });
  }
}
