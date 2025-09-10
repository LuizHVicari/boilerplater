import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL is not defined");
}

export const db = drizzle(dbUrl);
