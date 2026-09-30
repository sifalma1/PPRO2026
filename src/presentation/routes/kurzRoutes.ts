import { Router } from "express";
import { KurzController } from "../controllers/KurzController.js";

export function createKurzRouter(kurzController: KurzController): Router {
  const router = Router();

  router.get("/", kurzController.getAll);
  router.get("/:id", kurzController.getById);
  router.post("/", kurzController.create);
  router.put("/:id", kurzController.update);
  router.delete("/:id", kurzController.delete);

  return router;
}
