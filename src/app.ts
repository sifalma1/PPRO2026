import express, { Express } from "express";
import path from "path";
import { pool } from "./infrastructure/database/db.js";
import { PostgresKurzRepository } from "./infrastructure/database/PostgresKurzRepository.js";
import { KurzService } from "./application/services/KurzService.js";
import { KurzController } from "./presentation/controllers/KurzController.js";
import { createKurzRouter } from "./presentation/routes/kurzRoutes.js";

export function createApp(): Express {
  const app = express();

  // Middleware pro parsování JSON a URL-encoded těl požadavků
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Statické soubory pro webové rozhraní (Frontend)
  const publicDir = path.resolve(process.cwd(), "public");
  app.use(express.static(publicDir));

  // Inicializace vrstev (Dependency Injection)
  const kurzRepository = new PostgresKurzRepository(pool);
  const kurzService = new KurzService(kurzRepository);
  const kurzController = new KurzController(kurzService);

  // Napojení API směrovačů
  app.use("/api/kurzy", createKurzRouter(kurzController));

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
  });

  return app;
}
