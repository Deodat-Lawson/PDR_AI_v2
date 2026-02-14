import { type Config } from "drizzle-kit";


export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  tablesFilter: ["pdr_ai_v2_*"],
  migrations: {
    schema: "public",
  },
} as Config;
