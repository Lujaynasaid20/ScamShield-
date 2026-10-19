// Applies database/migrations/*.sql in order, once each, inside a transaction per file.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(rootDir, ".env.local"), quiet: true });
const migrationsDir = path.join(rootDir, "database", "migrations");

const client = new pg.Client({
  ...(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {}),
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || "scamshield",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD
});

await client.connect();
try {
  await client.query("create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())");
  const applied = new Set((await client.query("select name from schema_migrations")).rows.map(row => row.name));
  const files = fs.readdirSync(migrationsDir).filter(file => file.endsWith(".sql")).sort();
  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into schema_migrations (name) values ($1)", [file]);
      await client.query("commit");
      console.log(`Applied ${file}`);
      count += 1;
    } catch (error) {
      await client.query("rollback");
      console.error(`Migration ${file} failed: ${error.message}`);
      process.exitCode = 1;
      break;
    }
  }
  if (!process.exitCode) console.log(count ? `${count} migration(s) applied.` : "Database is up to date.");
} finally {
  await client.end();
}
