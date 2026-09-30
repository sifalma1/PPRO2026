import dotenv from "dotenv";
import { createApp } from "./app.js";
import { runMigrations } from "./infrastructure/database/migrate.js";

dotenv.config();

const PORT = parseInt(process.env.PORT || "3000", 10);

async function bootstrap() {
  try {
    console.log("=== Spouštění systému Akademie Trutnov (PPRO) ===");

    // Automatická aplikace databázových migrací
    await runMigrations();

    const app = createApp();

    app.listen(PORT, () => {
      console.log(`-> Aplikace běží na http://localhost:${PORT}`);
      console.log(`-> API kurzů dostupné na http://localhost:${PORT}/api/kurzy`);
      console.log(`-> Webový katalog dostupný na http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Kritická chyba při startu aplikace:", err);
    process.exit(1);
  }
}

bootstrap();
