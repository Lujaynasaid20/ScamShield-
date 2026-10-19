import pg from "pg";

const { Pool } = pg;

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis;

export const pool = globalForDb.scamshieldPool ?? new Pool({
  ...(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {}),
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || "scamshield",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD,
  // Fail fast with a clear error instead of hanging until the serverless function times out.
  connectionTimeoutMillis: 10000
});

if (process.env.NODE_ENV !== "production") globalForDb.scamshieldPool = pool;
