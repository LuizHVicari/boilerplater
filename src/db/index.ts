import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL is not defined");
}

export const DB_TOKEN = Symbol("DB");
const POOL_MAX_CONN_DEFAULT = 10;
const POOL_MAX_CONN = process.env.POOL_MAX_CONN
  ? Number(process.env.POOL_MAX_CONN)
  : POOL_MAX_CONN_DEFAULT;

const pool = new Pool({
  connectionString: dbUrl,
  max: POOL_MAX_CONN,
});

export const db = drizzle(pool);
