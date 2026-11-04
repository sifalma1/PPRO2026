import { Router } from "express";
import { CourseController } from "../controllers/CourseController.js";

export function createCourseRouter(controller: CourseController): Router {
  const router = Router();

  router.get("/", controller.getAll);
  router.get("/:id", controller.getById);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.delete);

  return router;
}
