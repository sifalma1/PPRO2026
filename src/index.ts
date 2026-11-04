import dotenv from "dotenv";
import { createApp } from "./app.js";
import { runMigrations } from "./infrastructure/database/migrate.js";

dotenv.config();

const PORT = parseInt(process.env.PORT || "3000", 10);

async function bootstrap() {
  try {
    console.log("=== Starting Akademie Trutnov Information System (PPRO) ===");

    // Automatically apply database migrations
    await runMigrations();

    const app = createApp();

    app.listen(PORT, () => {
      console.log(`-> Server is running on http://localhost:${PORT}`);
      console.log(`-> Courses API: http://localhost:${PORT}/api/courses`);
      console.log(`-> Terms API: http://localhost:${PORT}/api/terms`);
      console.log(`-> Attendance API: http://localhost:${PORT}/api/attendance`);
      console.log(`-> Certificates API: http://localhost:${PORT}/api/certificates`);
      console.log(`-> Web UI: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Critical error starting application:", err);
    process.exit(1);
  }
}

bootstrap();
