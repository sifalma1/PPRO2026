import { Request, Response } from "express";
import { CourseService } from "../../application/services/CourseService.js";

export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const isAccredited =
        req.query.accredited !== undefined
          ? req.query.accredited === "true"
          : req.query.jeAkreditovany !== undefined
            ? req.query.jeAkreditovany === "true"
            : undefined;
      const query = req.query.query
        ? String(req.query.query)
        : req.query.search
          ? String(req.query.search)
          : undefined;

      const courses = await this.courseService.getAllCourses({ isAccredited, query });
      res.status(200).json({ success: true, count: courses.length, data: courses });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error });
    }
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const course = await this.courseService.getCourseById(String(req.params.id));
      res.status(200).json({ success: true, data: course });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      res.status(404).json({ success: false, error });
    }
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body;
      const hoursVal = body.hours !== undefined ? body.hours : body.rozsahHodin;
      const priceVal = body.price !== undefined ? body.price : body.cena;
      const created = await this.courseService.createCourse({
        title: body.title || body.nazev,
        annotation: body.annotation || body.anotace,
        hours: hoursVal !== undefined ? Number(hoursVal) : NaN,
        price: priceVal !== undefined ? Number(priceVal) : NaN,
        isAccredited:
          body.isAccredited !== undefined
            ? Boolean(body.isAccredited)
            : Boolean(body.jeAkreditovany),
      });
      res
        .status(201)
        .json({ success: true, message: "Course created successfully.", data: created });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, error });
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body;
      const hoursVal = body.hours !== undefined ? body.hours : body.rozsahHodin;
      const priceVal = body.price !== undefined ? body.price : body.cena;
      const updated = await this.courseService.updateCourse(String(req.params.id), {
        title: body.title !== undefined ? body.title : body.nazev,
        annotation: body.annotation !== undefined ? body.annotation : body.anotace,
        hours: hoursVal !== undefined ? Number(hoursVal) : undefined,
        price: priceVal !== undefined ? Number(priceVal) : undefined,
        isAccredited:
          body.isAccredited !== undefined
            ? Boolean(body.isAccredited)
            : body.jeAkreditovany !== undefined
              ? Boolean(body.jeAkreditovany)
              : undefined,
      });
      res
        .status(200)
        .json({ success: true, message: "Course updated successfully.", data: updated });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, error });
    }
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.courseService.deleteCourse(String(req.params.id));
      res.status(200).json({ success: true, message: "Course deleted successfully." });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      res.status(404).json({ success: false, error });
    }
  };
}
