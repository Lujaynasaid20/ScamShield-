import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import pg from "pg";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(rootDir, ".env.local") });

const [emailArg, password, ...nameParts] = process.argv.slice(2);
const email = String(emailArg || "").trim().toLowerCase();
const displayName = nameParts.join(" ").trim() || "Administrator";

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 8) {
  console.error("Usage: npm run create-admin -- <email> <password (8+ characters)> [display name]");
  process.exit(1);
}

const client = new pg.Client({
  ...(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {}),
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || "scamshield",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD
});

await client.connect();
const result = await client.query(
  `insert into profiles (email, display_name, password_hash, role) values ($1, $2, $3, 'admin')
   on conflict (email) do update set password_hash = excluded.password_hash, display_name = excluded.display_name, role = 'admin'
   returning email, display_name, role`,
  [email, displayName, await bcrypt.hash(password, 12)]
);
await client.end();
console.log("Admin account ready:", result.rows[0]);
