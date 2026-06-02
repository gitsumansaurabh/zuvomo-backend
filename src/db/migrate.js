"use strict";

const fs = require("fs");
const path = require("path");
const { pool } = require("./pool");

async function runMigrations() {
  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("[migrate] No migration files found.");
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      console.log(`[migrate] Applying ${file} ...`);
      await client.query(sql);
    }
    await client.query("COMMIT");
    console.log("[migrate] All migrations applied successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[migrate] Migration failed, rolled back.", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
