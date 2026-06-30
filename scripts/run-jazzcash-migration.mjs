import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, "..", "migrations", "0027_jazzcash_transactions.sql");
const sql = readFileSync(sqlPath, "utf8");

const schema = process.env.DB_SCHEMA || process.env.DB_DATA_SCHEMA || "emrsoft_encrypted";
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new pg.Pool({ connectionString });

try {
  await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  await pool.query(`SET search_path TO "${schema}"`);
  await pool.query(sql);
  console.log(`✅ jazzcash_transactions table ready in schema "${schema}"`);
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
