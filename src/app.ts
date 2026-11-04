import express, { Express, Router } from "express";
import path from "path";
import { pool } from "./infrastructure/database/db.js";

// Repositories
import { PostgresCourseRepository } from "./infrastructure/database/PostgresCourseRepository.js";
import { PostgresTermRepository } from "./infrastructure/database/PostgresTermRepository.js";
import { PostgresAttendanceRepository } from "./infrastructure/database/PostgresAttendanceRepository.js";
import { PostgresCertificateRepository } from "./infrastructure/database/PostgresCertificateRepository.js";

// Services
import { CourseService } from "./application/services/CourseService.js";
import { TermService } from "./application/services/TermService.js";
import { AttendanceService } from "./application/services/AttendanceService.js";
import { CertificateService } from "./application/services/CertificateService.js";
import { AuthService } from "./application/services/AuthService.js";

// Controllers
import { CourseController } from "./presentation/controllers/CourseController.js";
import { TermController } from "./presentation/controllers/TermController.js";
import { AttendanceController } from "./presentation/controllers/AttendanceController.js";
import { CertificateController } from "./presentation/controllers/CertificateController.js";
import { AuthController } from "./presentation/controllers/AuthController.js";

// Middleware
import {
  createRequireAdminAuth,
  createRequireAuth,
} from "./presentation/middleware/authMiddleware.js";

// Routes
import { createCourseRouter } from "./presentation/routes/courseRoutes.js";

export function createApp(options?: { authService?: AuthService }): Express {
  const app = express();

  // Middleware for parsing JSON and URL-encoded request bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static files for client UI (Frontend)
  const publicDir = path.resolve(process.cwd(), "public");
  app.use(express.static(publicDir));

  // Initialize repositories
  const courseRepository = new PostgresCourseRepository(pool);
  const termRepository = new PostgresTermRepository(pool);
  const attendanceRepository = new PostgresAttendanceRepository(pool);
  const certificateRepository = new PostgresCertificateRepository(pool);

  // Initialize application services
  const courseService = new CourseService(courseRepository);
  const termService = new TermService(termRepository);
  const attendanceService = new AttendanceService(attendanceRepository);
  const certificateService = new CertificateService(certificateRepository);
  const authService = options?.authService || new AuthService(pool);

  // Initialize security middleware
  const requireAdminAuth = createRequireAdminAuth(authService);
  const requireAuth = createRequireAuth(authService);

  // Initialize presentation controllers
  const courseController = new CourseController(courseService);
  const termController = new TermController(termService);
  const attendanceController = new AttendanceController(attendanceService);
  const certificateController = new CertificateController(certificateService);
  const authController = new AuthController(authService);

  // ===================== REST API ROUTES =====================

  // 0. Authentication & Authorization Endpoints (ADR-07)
  const authRouter = Router();
  authRouter.post("/login", authController.login);
  authRouter.post("/logout", authController.logout);
  authRouter.get("/me", authController.getMe);
  authRouter.get("/status", authController.getStatus);
  app.use("/api/auth", authRouter);

  // Student Portal Protected Endpoints
  app.get("/api/student/dashboard", requireAuth, authController.getStudentDashboard);
  app.get("/api/student/me", requireAuth, authController.getStudentDashboard);

  // 1. Courses (Primary English + Czech alias) - Protected with requireAdminAuth on CUD
  const courseRouter = createCourseRouter(courseController, requireAdminAuth);
  app.use("/api/courses", courseRouter);
  app.use("/api/kurzy", courseRouter);

  // 2. Terms & Enrollments (Primary English + Czech alias)
  const termRouter = Router();
  termRouter.get("/", termController.getAll);
  termRouter.post("/", requireAdminAuth, termController.create);
  termRouter.get("/:id", termController.getById);
  termRouter.get("/:id/enrollments", termController.getEnrollments);
  termRouter.get("/:id/prihlasky", termController.getEnrollments);
  // Public users can submit an enrollment (ADR-02)
  termRouter.post("/:id/enrollments", termController.createEnrollment);
  termRouter.post("/:id/prihlasky", termController.createEnrollment);
  termRouter.post("/:termId/complete", requireAdminAuth, certificateController.completeTerm);
  app.use("/api/terms", termRouter);
  app.use("/api/terminy", termRouter);

  // 3. Enrollments direct actions
  app.post("/api/enrollments/:enrollmentId/cancel", termController.cancelEnrollment);
  app.post("/api/prihlasky/:prihlaskaId/cancel", termController.cancelEnrollment);

  // 4. Teaching Days & Attendance (ADR-01, ADR-05)
  const attendanceRouter = Router();
  attendanceRouter.get("/terms/:termId/days", attendanceController.getTeachingDays);
  attendanceRouter.post(
    "/terms/:termId/days",
    requireAdminAuth,
    attendanceController.createTeachingDay
  );
  attendanceRouter.get("/days/:dayId", attendanceController.getAttendanceForDay);
  attendanceRouter.post("/days/:dayId/mark", requireAdminAuth, attendanceController.markAttendance);
  attendanceRouter.get("/terms/:termId/summary", attendanceController.getAttendanceSummary);
  app.use("/api/attendance", attendanceRouter);

  // 5. Certificates (ADR-01)
  const certificateRouter = Router();
  certificateRouter.get("/", certificateController.getAll);
  certificateRouter.get("/:id", certificateController.getById);
  certificateRouter.post("/issue", requireAdminAuth, certificateController.issue);
  app.use("/api/certificates", certificateRouter);
  app.use("/api/osvedceni", certificateRouter);

  // 6. Dictionaries & Analytics
  app.get("/api/lecturers", termController.getLecturers);
  app.get("/api/lektori", termController.getLecturers);
  app.get("/api/classrooms", termController.getClassrooms);
  app.get("/api/ucebny", termController.getClassrooms);
  app.get("/api/students", termController.getStudents);
  app.get("/api/studenti", termController.getStudents);
  app.get("/api/analytics", termController.getAnalytics);
  app.get("/api/prehledy", termController.getAnalytics);

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
  });

  return app;
}
