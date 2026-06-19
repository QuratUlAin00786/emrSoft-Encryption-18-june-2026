import { defineConfig } from "drizzle-kit";
import {
  appendSearchPathToConnectionString,
  getDatabaseConnectionString,
  getDatabaseSchema,
} from "./server/db-config";

const schema = getDatabaseSchema();
const url = appendSearchPathToConnectionString(
  getDatabaseConnectionString(),
  schema,
);

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
  schemaFilter: ["public", schema, "encryption_cura", "curauser24nov25"],
});
