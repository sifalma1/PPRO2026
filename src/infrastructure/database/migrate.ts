import fs from "fs";
import path from "path";
import { pool } from "./db.js";

/**
 * Jednoduchý správce databázových migrací
 */
export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    console.log("-> Kontrola a aplikace databázových migrací...");

    // Vytvoření tabulky pro evidenci migrací
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Načtení migračních souborů
    const migrationsDir = path.resolve(process.cwd(), "migrations");
    if (!fs.existsSync(migrationsDir)) {
      console.warn("Složka migrací nenalezena:", migrationsDir);
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const res = await client.query("SELECT id FROM _migrations WHERE filename = $1", [file]);
      if (res.rows.length === 0) {
        console.log(`   Aplikuji migraci: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO _migrations (filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`   Migrace ${file} byla úspěšně aplikována.`);
      }
    }
    console.log("-> Všechny migrace jsou aktuální.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Chyba při provádění migrací:", err);
    throw err;
  } finally {
    client.release();
  }
}

// Pokud je skript spuštěn přímo z příkazové řádky
if (process.argv[1] && (process.argv[1].endsWith("migrate.ts") || process.argv[1].endsWith("migrate.js"))) {
  runMigrations()
    .then(() => {
      console.log("Migrace dokončeny.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
