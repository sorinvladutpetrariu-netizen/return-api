import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL missing");
  process.exit(1);
}

/**
 * Railway Postgres (public proxy) poate da "self-signed certificate in certificate chain".
 * In productie punem ssl cu rejectUnauthorized=false.
 */
const ssl =
  process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : undefined;

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl,
});

export const db = drizzle(pool);