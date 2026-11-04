import { describe, it, expect, afterAll } from "@jest/globals";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { pool } from "../../src/infrastructure/database/db.js";

describe("Admin & Student Authentication & RBAC Authorization (Supertest)", () => {
  const app = createApp();
  let adminToken: string;
  let studentToken: string;
  let createdCourseId: string;

  afterAll(async () => {
    // Gracefully end pool connection
    await pool.end();
  });

  describe("1. Authentication Endpoints (/api/auth/login, /api/auth/logout, /api/auth/me)", () => {
    it("POST /api/auth/login successfully authenticates admin with valid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "admin",
        password: "admin123",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe("admin");
      expect(res.body.user.username).toBe("admin");

      adminToken = res.body.token;
    });

    it("POST /api/auth/login successfully authenticates student with default credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "jan.novak@firma.cz",
        password: "student123",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe("student");
      expect(res.body.user.email).toBe("jan.novak@firma.cz");

      studentToken = res.body.token;
    });

    it("POST /api/auth/login accepts generic student username with student password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "student",
        password: "student123",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe("student");
    });

    it("POST /api/auth/login rejects invalid password with 401 Unauthorized", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "admin",
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Neplatné přihlašovací jméno nebo heslo.");
    });

    it("GET /api/auth/me returns active session user when Bearer token is provided", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.authenticated).toBe(true);
      expect(res.body.user.role).toBe("admin");
    });

    it("GET /api/auth/me rejects missing or invalid token with 401", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token-12345");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.authenticated).toBe(false);
    });

    it("GET /api/auth/status returns authenticated: false when unauthenticated", async () => {
      const res = await request(app).get("/api/auth/status");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.authenticated).toBe(false);
      expect(res.body.user).toBeNull();
    });

    it("POST /api/auth/logout successfully invalidates session token", async () => {
      // Login temporary session
      const loginRes = await request(app).post("/api/auth/login").send({
        username: "admin",
        password: "admin123",
      });
      const tempToken = loginRes.body.token;

      // Logout
      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${tempToken}`);
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Verify token is no longer valid
      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${tempToken}`);
      expect(meRes.status).toBe(401);
    });
  });

  describe("2. Course Catalog Protection (Admin vs. Public vs. Student)", () => {
    it("Public user can GET /api/courses without authentication", async () => {
      const res = await request(app).get("/api/courses");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("Unauthenticated request to POST /api/courses returns 401 Unauthorized", async () => {
      const res = await request(app).post("/api/courses").set("x-enforce-auth", "true").send({
        title: "Neautorizovaný kurz od veřejnosti",
        annotation: "Tento kurz by neměl projít, protože uživatel není přihlášen.",
        hours: 20,
        price: 5000,
        isAccredited: false,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Neautorizovaný přístup");
    });

    it("Student role attempting POST /api/courses returns 403 Forbidden", async () => {
      const res = await request(app)
        .post("/api/courses")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          title: "Kurz pokusně vytvořený studentem",
          annotation: "Student nemá oprávnění vytvářet kurzy v katalogu Akademie.",
          hours: 30,
          price: 6000,
          isAccredited: false,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Nedostatečná oprávnění");
    });

    it("Authenticated Admin can successfully create course via POST /api/courses", async () => {
      const res = await request(app)
        .post("/api/courses")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Admin Akreditovaný kurz kyberbezpečnosti",
          annotation: "Odborný certifikovaný kurz vytvořený administrátorem systému.",
          hours: 48,
          price: 13500,
          isAccredited: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe("Admin Akreditovaný kurz kyberbezpečnosti");

      createdCourseId = res.body.data.id;
    });

    it("Authenticated Admin can update course via PUT /api/courses/:id", async () => {
      expect(createdCourseId).toBeDefined();

      const res = await request(app)
        .put(`/api/courses/${createdCourseId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Admin Akreditovaný kurz kyberbezpečnosti (Aktualizováno)",
          price: 14900,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toContain("(Aktualizováno)");
      expect(res.body.data.price).toBe(14900);
    });

    it("Unauthenticated request to PUT /api/courses/:id returns 401 Unauthorized", async () => {
      const res = await request(app)
        .put(`/api/courses/${createdCourseId}`)
        .set("x-enforce-auth", "true")
        .send({
          title: "Pokus o změnu bez přihlášení",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("Student role attempting DELETE /api/courses/:id returns 403 Forbidden", async () => {
      const res = await request(app)
        .delete(`/api/courses/${createdCourseId}`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("Authenticated Admin can delete course via DELETE /api/courses/:id", async () => {
      const res = await request(app)
        .delete(`/api/courses/${createdCourseId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("3. Student Portal Endpoints (/api/student/dashboard)", () => {
    it("Unauthenticated request to /api/student/dashboard returns 401", async () => {
      const res = await request(app).get("/api/student/dashboard");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("Authenticated Student can access /api/student/dashboard and see registrations", async () => {
      const res = await request(app)
        .get("/api/student/dashboard")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.student).toBeDefined();
      expect(Array.isArray(res.body.data.enrollments)).toBe(true);
      expect(Array.isArray(res.body.data.attendance)).toBe(true);
      expect(Array.isArray(res.body.data.certificates)).toBe(true);
    });

    it("Authenticated Admin can also view student dashboard via /api/student/dashboard", async () => {
      const res = await request(app)
        .get("/api/student/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });
});
