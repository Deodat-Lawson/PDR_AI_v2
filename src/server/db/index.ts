import { Pool } from '@neondatabase/serverless';
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  conn: Pool | undefined;
  db: ReturnType<typeof drizzle> | undefined;
};

const conn = globalForDb.conn ?? new Pool({ connectionString: process.env.DATABASE_URL! });
if (process.env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = globalForDb.db ?? drizzle(conn, { schema });
if (process.env.NODE_ENV !== "production") globalForDb.db = db;