import express, { Express, Router } from "express";
import path from "path";
import { pool } from "./infrastructure/database/db.js";
import { PostgresKurzRepository } from "./infrastructure/database/PostgresKurzRepository.js";
import { KurzService } from "./application/services/KurzService.js";
import { KurzController } from "./presentation/controllers/KurzController.js";
import { createKurzRouter } from "./presentation/routes/kurzRoutes.js";
import { PostgresTerminRepository } from "./infrastructure/database/PostgresTerminRepository.js";
import { TerminService } from "./application/services/TerminService.js";
import { TerminController } from "./presentation/controllers/TerminController.js";

export function createApp(): Express {
  const app = express();

  // Middleware pro parsování JSON a URL-encoded těl požadavků
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Statické soubory pro webové rozhraní (Frontend)
  const publicDir = path.resolve(process.cwd(), "public");
  app.use(express.static(publicDir));

  // Inicializace vrstev pro Kurzy
  const kurzRepository = new PostgresKurzRepository(pool);
  const kurzService = new KurzService(kurzRepository);
  const kurzController = new KurzController(kurzService);

  // Inicializace vrstev pro Termíny, Přihlášky, Lektory a Přehledy
  const terminRepository = new PostgresTerminRepository(pool);
  const terminService = new TerminService(terminRepository);
  const terminController = new TerminController(terminService);

  // Napojení API směrovačů
  app.use("/api/kurzy", createKurzRouter(kurzController));

  // Router pro termíny a přihlášky
  const terminRouter = Router();
  terminRouter.get("/", terminController.getAll);
  terminRouter.post("/", terminController.create);
  terminRouter.get("/:id", terminController.getById);
  terminRouter.get("/:id/prihlasky", terminController.getPrihlasky);
  terminRouter.post("/:id/prihlasky", terminController.createPrihlaska);
  app.use("/api/terminy", terminRouter);

  // Rušení přihlášek (s posunem z pořadníku)
  app.post("/api/prihlasky/:prihlaskaId/cancel", terminController.cancelPrihlaska);

  // Číselníky a přehledy
  app.get("/api/lektori", terminController.getLektori);
  app.get("/api/ucebny", terminController.getUcebny);
  app.get("/api/studenti", terminController.getStudenti);
  app.get("/api/prehledy", terminController.getAnalytics);

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
  });

  return app;
}
