import { Router, RequestHandler } from "express";
import { CourseController } from "../controllers/CourseController.js";

export function createCourseRouter(
  controller: CourseController,
  requireAdminAuth?: RequestHandler
): Router {
  const router = Router();
  const authGuard: RequestHandler = requireAdminAuth || ((_req, _res, next) => next());

  router.get("/", controller.getAll);
  router.get("/:id", controller.getById);
  router.post("/", authGuard, controller.create);
  router.put("/:id", authGuard, controller.update);
  router.delete("/:id", authGuard, controller.delete);

  return router;
}
