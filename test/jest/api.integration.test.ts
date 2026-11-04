import { describe, it, expect, afterAll } from "@jest/globals";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { pool } from "../../src/infrastructure/database/db.js";

describe("Express API Integration and Route Verification (Supertest)", () => {
  const app = createApp();

  afterAll(async () => {
    // Gracefully close PostgreSQL connection pool to prevent hanging Jest runner
    await pool.end();
  });

  describe("Health Check Endpoint", () => {
    it("GET /health responds with 200 and UP status", async () => {
      const res = await request(app).get("/health");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("UP");
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe("Courses REST API (/api/courses and /api/kurzy alias)", () => {
    it("GET /api/courses returns 200 and a list of courses", async () => {
      const res = await request(app).get("/api/courses");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(typeof res.body.count).toBe("number");
    });

    it("GET /api/kurzy (Czech alias) returns 200 and mirrors /api/courses", async () => {
      const res = await request(app).get("/api/kurzy");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("POST /api/courses returns 400 when title is shorter than 3 characters", async () => {
      const res = await request(app).post("/api/courses").send({
        title: "AB",
        annotation: "Valid annotation with more than ten characters.",
        hours: 16,
        price: 4500,
        isAccredited: false,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Course title must be between 3 and 150 characters.");
    });

    it("POST /api/courses returns 400 when hours are non-positive", async () => {
      const res = await request(app).post("/api/courses").send({
        title: "Valid Course Title",
        annotation: "Valid annotation with more than ten characters.",
        hours: 0,
        price: 4500,
        isAccredited: false,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Course hours must be a positive integer greater than 0.");
    });

    it("POST /api/courses returns 400 when price is negative", async () => {
      const res = await request(app).post("/api/courses").send({
        title: "Valid Course Title",
        annotation: "Valid annotation with more than ten characters.",
        hours: 20,
        price: -500,
        isAccredited: false,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Course price cannot be negative.");
    });
  });

  describe("Terms and Enrollments REST API (/api/terms and /api/terminy alias)", () => {
    it("GET /api/terms returns 200 with list of scheduled terms", async () => {
      const res = await request(app).get("/api/terms");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("GET /api/terminy (Czech alias) returns 200 and mirrors /api/terms", async () => {
      const res = await request(app).get("/api/terminy");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("GET /api/terms/:id returns 404 for non-existent term ID", async () => {
      const res = await request(app).get("/api/terms/00000000-0000-0000-0000-000000000000");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Certificates REST API (/api/certificates and /api/osvedceni alias)", () => {
    it("GET /api/certificates returns 200 with list of issued certificates", async () => {
      const res = await request(app).get("/api/certificates");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("GET /api/osvedceni (Czech alias) returns 200", async () => {
      const res = await request(app).get("/api/osvedceni");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("POST /api/certificates/issue returns 400 when enrollmentId is missing", async () => {
      const res = await request(app).post("/api/certificates/issue").send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Teaching Days and Attendance REST API (/api/attendance)", () => {
    it("GET /api/attendance/terms/:termId/days returns 200 with teaching days array", async () => {
      const res = await request(app).get(
        "/api/attendance/terms/00000000-0000-0000-0000-000000000000/days"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("GET /api/attendance/terms/:termId/summary returns 200 with attendance summary", async () => {
      const res = await request(app).get(
        "/api/attendance/terms/00000000-0000-0000-0000-000000000000/summary"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("Dictionaries & Analytical Overview Endpoints", () => {
    it("GET /api/lecturers and /api/lektori return 200 with lecturer data", async () => {
      const resEn = await request(app).get("/api/lecturers");
      const resCs = await request(app).get("/api/lektori");

      expect(resEn.status).toBe(200);
      expect(resEn.body.success).toBe(true);
      expect(Array.isArray(resEn.body.data)).toBe(true);

      expect(resCs.status).toBe(200);
      expect(resCs.body.success).toBe(true);
    });

    it("GET /api/classrooms and /api/ucebny return 200 with classroom data", async () => {
      const resEn = await request(app).get("/api/classrooms");
      const resCs = await request(app).get("/api/ucebny");

      expect(resEn.status).toBe(200);
      expect(resEn.body.success).toBe(true);
      expect(Array.isArray(resEn.body.data)).toBe(true);

      expect(resCs.status).toBe(200);
      expect(resCs.body.success).toBe(true);
    });

    it("GET /api/students and /api/studenti return 200 with student data", async () => {
      const resEn = await request(app).get("/api/students");
      const resCs = await request(app).get("/api/studenti");

      expect(resEn.status).toBe(200);
      expect(resEn.body.success).toBe(true);
      expect(Array.isArray(resEn.body.data)).toBe(true);

      expect(resCs.status).toBe(200);
      expect(resCs.body.success).toBe(true);
    });

    it("GET /api/analytics and /api/prehledy return 200 with summary metrics", async () => {
      const resEn = await request(app).get("/api/analytics");
      const resCs = await request(app).get("/api/prehledy");

      expect(resEn.status).toBe(200);
      expect(resEn.body.success).toBe(true);
      expect(resEn.body.data).toBeDefined();

      expect(resCs.status).toBe(200);
      expect(resCs.body.success).toBe(true);
    });
  });
});
